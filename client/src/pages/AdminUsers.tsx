import React, { useEffect, useState, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";

interface UserDetail {
  id: number;
  username: string;
  email: string;
  role: string;
  employeeId?: number | null;
  active: boolean;
  suspended: boolean;
  createdAt: string;
  updatedAt: string;
  employee?: { id: number; employee_no: string; name: string; department: string; designation: string } | null;
  emailPreferences?: Record<string, boolean>;
}

interface UserAction {
  type: "deactivate" | "reactivate" | "suspend";
  target: UserDetail;
}

const ROLES = [
  "ALL",
  "ADMIN",
  "RECOMMENDING_EMPLOYEE",
  "TRAINING_CENTER_SECTION_HEAD",
  "TRAINING_IN_CHARGE",
  "ED_GM_APPROVER",
  "APPLICANT",
];

const NOTIFICATION_TYPES = ["GLOBAL", "APPROVAL", "PERMISSION", "CERTIFICATE", "NODUE", "REMINDER"];

const TYPE_LABELS: Record<string, string> = {
  GLOBAL: "Global Email Toggle",
  APPROVAL: "Approval Notifications",
  PERMISSION: "Permission Letter Notifications",
  CERTIFICATE: "Certificate Notifications",
  NODUE: "No Due Clearance Notifications",
  REMINDER: "Automated Reminders",
};

// ── Compact Action Dropdown ──
const ActionDropdown = ({ user, onAction }: { user: UserDetail; onAction: (action: string, target: UserDetail) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items: { label: string; action: string; color?: string; show: (u: UserDetail) => boolean }[] = [
    { label: "Edit Role", action: "role", show: () => true },
    { label: "Reset Password", action: "pwd", show: () => true },
    { label: "Upload Photo", action: "photo", show: () => true },
    { label: "Notifications", action: "notifications", color: "#0891b2", show: () => true },
    { label: "Deactivate", action: "deactivate", color: "#dc2626", show: (u) => u.active },
    { label: "Reactivate", action: "reactivate", color: "#16a34a", show: (u) => !u.active },
    { label: "Suspend", action: "suspend", color: "#f59e0b", show: (u) => u.active && !u.suspended },
    { label: "View Activity", action: "activity", color: "#6366f1", show: () => true },
    { label: "Delete", action: "delete", color: "#dc2626", show: () => true },
  ];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => setOpen(!open)}
        style={{ padding: "4px 8px", fontSize: "12px", whiteSpace: "nowrap" }}
      >
        Actions ▾
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            minWidth: "170px",
            background: "var(--panel-bg, #fff)",
            border: "1px solid var(--border-color, #e2e8f0)",
            borderRadius: "8px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            zIndex: 1000,
            padding: "4px",
            marginTop: "4px",
          }}
        >
          {items
            .filter((item) => item.show(user))
            .map((item) => (
              <button
                key={item.action}
                onClick={() => {
                  setOpen(false);
                  onAction(item.action, user);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  borderRadius: "6px",
                  color: item.color || "var(--text-primary, #1f2937)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nav-hover, #f1f5f9)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                {item.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: number; role: string } | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("APPLICANT");
  const [creating, setCreating] = useState(false);

  const [resetTarget, setResetTarget] = useState<{ id: number; username: string } | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const [profilePicTarget, setProfilePicTarget] = useState<number | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);

  const [confirmAction, setConfirmAction] = useState<UserAction | null>(null);
  const [actioning, setActioning] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<UserDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [auditTarget, setAuditTarget] = useState<UserDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [roleTarget, setRoleTarget] = useState<UserDetail | null>(null);

  // Notification preferences state
  const [notificationTarget, setNotificationTarget] = useState<UserDetail | null>(null);
  const [userPrefs, setUserPrefs] = useState<Record<string, boolean>>({});
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users");
      setUsers(response.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSave = async () => {
    if (!roleTarget || !editingRole) return;
    setSavingRole(true);
    try {
      await api.put(`/users/${editingRole.id}/role`, { role: editingRole.role });
      setEditingRole(null);
      setRoleTarget(null);
      addToast("success", "Role updated");
      await fetchUsers();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      return addToast("error", "Username, email, and password are required");
    }
    setCreating(true);
    try {
      await api.post("/auth/register", {
        username: newUsername.trim(),
        email: newEmail.trim(),
        password: newPassword,
        role: newRole,
      });
      setShowCreateForm(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("APPLICANT");
      addToast("success", "User created");
      await fetchUsers();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newUserPassword.trim()) return;
    setResetting(true);
    try {
      await api.put(`/auth/${resetTarget.id}/password`, { password: newUserPassword });
      setResetTarget(null);
      setNewUserPassword("");
      addToast("success", `Password reset for ${resetTarget.username}`);
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profilePicTarget) return;
    setUploadingPic(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/uploads/profile-pic/${profilePicTarget}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfilePicTarget(null);
      addToast("success", "Profile picture updated");
    } catch {
      addToast("error", "Failed to upload");
    } finally {
      setUploadingPic(false);
    }
  };

  const handleAccountAction = async () => {
    if (!confirmAction) return;
    setActioning(true);
    try {
      await api.post(`/users/${confirmAction.target.id}/${confirmAction.type}`);
      setConfirmAction(null);
      addToast("success", `User ${confirmAction.type}d`);
      await fetchUsers();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || `Failed to ${confirmAction.type} user`);
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      addToast("success", `User ${deleteTarget.username} deleted`);
      await fetchUsers();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const loadAuditLog = async (user: UserDetail) => {
    setAuditTarget(user);
    setAuditLoading(true);
    setAuditLogs([]);
    try {
      const res = await api.get("/audit-logs", { params: { userId: user.id, perPage: 20 } });
      setAuditLogs(res.data.data || []);
    } catch {
      addToast("error", "Failed to load audit log");
    } finally {
      setAuditLoading(false);
    }
  };

  // Load user notification preferences
  const loadUserPreferences = async (user: UserDetail) => {
    setNotificationTarget(user);
    setUserPrefs(user.emailPreferences || {});
  };

  // Toggle a single notification type for user
  const toggleUserPref = (type: string) => {
    setUserPrefs((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // Save user notification preferences
  const handleSavePreferences = async () => {
    if (!notificationTarget) return;
    setSavingPrefs(true);
    try {
      await api.put(`/users/${notificationTarget.id}/email-preferences`, { preferences: userPrefs });
      addToast("success", "Notification preferences saved");
      setNotificationTarget(null);
      await fetchUsers();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Toggle all notifications for user
  const toggleAllUserNotifications = async (enabled: boolean) => {
    if (!notificationTarget) return;
    setSavingPrefs(true);
    try {
      await api.put(`/users/${notificationTarget.id}/toggle-all-notifications`, { enabled });
      setUserPrefs(Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t, enabled])));
      addToast("success", `${enabled ? "Enabled" : "Disabled"} all notifications`);
      await fetchUsers();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Failed to update notifications");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAction = (action: string, target: UserDetail) => {
    switch (action) {
      case "role":
        setRoleTarget(target);
        setEditingRole({ id: target.id, role: target.role });
        break;
      case "pwd":
        setResetTarget({ id: target.id, username: target.username });
        break;
      case "photo":
        setProfilePicTarget(target.id);
        break;
      case "notifications":
        loadUserPreferences(target);
        break;
      case "deactivate":
        setConfirmAction({ type: "deactivate", target });
        break;
      case "reactivate":
        setConfirmAction({ type: "reactivate", target });
        break;
      case "suspend":
        setConfirmAction({ type: "suspend", target });
        break;
      case "activity":
        loadAuditLog(target);
        break;
      case "delete":
        setDeleteTarget(target);
        break;
    }
  };

  const handleCleanup = async () => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await api.post("/users/cleanup/invalid");
      setCleanupResult(res.data.message);
      addToast("success", res.data.message);
      await fetchUsers();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (!search ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase()) ||
        u.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.employee?.employee_no?.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === "ALL" || u.role === roleFilter),
  );

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const pagedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div className="action-bar" style={{ marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>User Management</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                Manage system users, roles, passwords, and profiles.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {isAdmin && (
                <button className="btn btn-outline btn-sm" onClick={handleCleanup} disabled={cleaning}>
                  {cleaning ? "Cleaning..." : "🧹 Cleanup Invalid"}
                </button>
              )}
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
                  + Create User
                </button>
              )}
            </div>
          </div>

          <div className="search-bar" style={{ marginBottom: "16px" }}>
            <input
              type="text"
              className="form-input"
              style={{ minWidth: "240px" }}
              placeholder="Search by username, email, role, employee name/code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="form-input"
              style={{ minWidth: "150px" }}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "ALL" ? "All Roles" : r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={fetchUsers} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {cleanupResult && (
            <div
              style={{
                padding: "10px 14px",
                background: "var(--info-bg)",
                borderRadius: "8px",
                color: "var(--info-text)",
                marginBottom: "12px",
                fontSize: "13px",
              }}
            >
              {cleanupResult}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                borderRadius: "8px",
                color: "#991b1b",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Modals ── */}
          <Modal
            open={showCreateForm}
            title="Create New User"
            onClose={() => setShowCreateForm(false)}
            actions={
              <>
                <button className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreateUser} disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </button>
              </>
            }
          >
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label className="form-label">Username *</label>
                <input
                  className="form-input"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Unique username"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@gnfc.in"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label className="form-label">Password *</label>
                <input
                  className="form-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label className="form-label">Role</label>
                <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ width: "100%" }}>
                  {ROLES.filter((r) => r !== "ALL").map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Modal>

          <Modal
            open={!!resetTarget}
            title={`Reset Password: ${resetTarget?.username || ""}`}
            onClose={() => {
              setResetTarget(null);
              setNewUserPassword("");
            }}
            actions={
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setResetTarget(null);
                    setNewUserPassword("");
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting || !newUserPassword.trim()}>
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </>
            }
          >
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
          </Modal>

          <Modal
            open={!!roleTarget && !!editingRole}
            title={`Edit Role: ${roleTarget?.username || ""}`}
            onClose={() => {
              setEditingRole(null);
              setRoleTarget(null);
            }}
            actions={
              <>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setEditingRole(null);
                    setRoleTarget(null);
                  }}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleRoleSave} disabled={savingRole}>
                  {savingRole ? "Saving..." : "Save Role"}
                </button>
              </>
            }
          >
            <div className="form-group">
              <label className="form-label">Select Role</label>
              <select
                className="form-input"
                style={{ width: "100%" }}
                value={editingRole?.role || ""}
                onChange={(e) => setEditingRole((prev) => (prev ? { ...prev, role: e.target.value } : null))}
              >
                {ROLES.filter((r) => r !== "ALL").map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </Modal>

          <Modal
            open={!!confirmAction}
            title={
              confirmAction?.type === "deactivate"
                ? "Deactivate User"
                : confirmAction?.type === "reactivate"
                  ? "Reactivate User"
                  : "Suspend User"
            }
            onClose={() => setConfirmAction(null)}
            actions={
              <>
                <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAccountAction} disabled={actioning}>
                  {actioning ? "Confirming..." : "Confirm"}
                </button>
              </>
            }
          >
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              {confirmAction?.type === "deactivate" &&
                `Deactivate "${confirmAction?.target.username}"? They will not be able to log in.`}
              {confirmAction?.type === "reactivate" && `Reactivate "${confirmAction?.target.username}" — restore full access.`}
              {confirmAction?.type === "suspend" && `Suspend "${confirmAction?.target.username}" — temporarily disable account.`}
            </p>
          </Modal>

          <Modal
            open={!!deleteTarget}
            title="Delete User"
            onClose={() => setDeleteTarget(null)}
            actions={
              <>
                <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </>
            }
          >
            <p>
              Permanently delete <strong>{deleteTarget?.username}</strong>?<br />
              <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>The account will be soft-deleted.</span>
            </p>
          </Modal>

          <Modal
            open={!!auditTarget}
            title={`Activity: ${auditTarget?.username || ""}`}
            onClose={() => setAuditTarget(null)}
            width="700px"
          >
            {auditLoading ? (
              <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
            ) : auditLogs.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No activity found.</p>
            ) : (
              <div style={{ maxHeight: "400px", overflow: "auto" }}>
                {auditLogs.map((log: any, i: number) => (
                  <details key={log.id || i} style={{ marginBottom: "8px", fontSize: "13px" }}>
                    <summary
                      style={{
                        cursor: "pointer",
                        padding: "8px",
                        background: "var(--nav-hover, #f1f5f9)",
                        borderRadius: "6px",
                        listStyle: "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 500 }}>{log.action}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </summary>
                    <div
                      style={{
                        padding: "12px",
                        background: "var(--panel-bg, #fff)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "0 0 6px 6px",
                        marginTop: "2px",
                      }}
                    >
                      <div style={{ marginBottom: "6px" }}>
                        <strong>Entity:</strong> {log.entity_name} #{log.entity_id}
                      </div>
                      {log.old_value && (
                        <div style={{ marginBottom: "4px" }}>
                          <strong>Old Value:</strong>
                          <pre
                            style={{
                              fontSize: "11px",
                              background: "#f8fafc",
                              padding: "6px",
                              borderRadius: "4px",
                              marginTop: "2px",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {log.old_value}
                          </pre>
                        </div>
                      )}
                      {log.new_value && (
                        <div style={{ marginBottom: "4px" }}>
                          <strong>New Value:</strong>
                          <pre
                            style={{
                              fontSize: "11px",
                              background: "#f0fdf4",
                              padding: "6px",
                              borderRadius: "4px",
                              marginTop: "2px",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {log.new_value}
                          </pre>
                        </div>
                      )}
                      {log.ip_address && (
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          <strong>IP:</strong> {log.ip_address}
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </Modal>

          <Modal
            open={!!profilePicTarget}
            title="Upload Profile Picture"
            onClose={() => setProfilePicTarget(null)}
            actions={
              uploadingPic ? (
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Uploading...</span>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="file" accept="image/*" onChange={handleProfilePicUpload} />
                  <button className="btn btn-outline" onClick={() => setProfilePicTarget(null)}>
                    Cancel
                  </button>
                </div>
              )
            }
          >
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Select a profile picture image file (JPG, PNG).</p>
          </Modal>

          {/* Notification Preferences Modal */}
          <Modal
            open={!!notificationTarget}
            title={`Notification Preferences: ${notificationTarget?.username || ""}`}
            onClose={() => setNotificationTarget(null)}
            width="500px"
            actions={
              <>
                <button className="btn btn-outline" onClick={() => setNotificationTarget(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSavePreferences} disabled={savingPrefs}>
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </button>
              </>
            }
          >
            <div style={{ display: "grid", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <strong>Master Toggle</strong>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>
                    Enable or disable all notifications for this user
                  </p>
                </div>
                <button
                  className={`btn btn-sm ${Object.values(userPrefs).every((v) => v !== false) ? "btn-primary" : "btn-outline"}`}
                  onClick={() => {
                    const allEnabled = Object.values(userPrefs).every((v) => v !== false);
                    toggleAllUserNotifications(!allEnabled);
                  }}
                  disabled={savingPrefs}
                >
                  {Object.values(userPrefs).every((v) => v !== false) ? "Disable All" : "Enable All"}
                </button>
              </div>
              {NOTIFICATION_TYPES.map((type) => (
                <div key={type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{TYPE_LABELS[type]}</span>
                  </div>
                  <button
                    className={`btn btn-sm ${userPrefs[type] !== false ? "btn-primary" : "btn-outline"}`}
                    onClick={() => toggleUserPref(type)}
                    disabled={savingPrefs}
                  >
                    {userPrefs[type] !== false ? "Enabled" : "Disabled"}
                  </button>
                </div>
              ))}
            </div>
          </Modal>

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading users...</p>
          ) : pagedUsers.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No users found.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username (EC)</th>
                      <th>Email</th>
                      <th>Employee Name</th>
                      <th>EC No</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      {isAdmin && <th style={{ width: "100px" }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((u) => (
                      <tr
                        key={u.id}
                        style={{ opacity: !u.active ? 0.5 : 1, background: u.suspended ? "var(--danger-bg, #fef2f2)" : undefined }}
                      >
                        <td style={{ color: "var(--text-secondary)" }}>{u.id}</td>
                        <td style={{ fontWeight: 500 }}>{u.username}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.email}</td>
                        <td>{u.employee?.name || "-"}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{u.employee?.employee_no || "-"}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.employee?.department || "-"}</td>
                        <td>
                          <span className="badge badge-info">{u.role.replace(/_/g, " ")}</span>
                        </td>
                        <td>
                          {u.suspended ? (
                            <span className="badge badge-danger">Suspended</span>
                          ) : !u.active ? (
                            <span className="badge badge-default">Inactive</span>
                          ) : (
                            <span className="badge badge-success">Active</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td>
                            <ActionDropdown user={u} onAction={handleAction} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ marginTop: "12px", display: "flex", gap: "4px", justifyContent: "center" }}>
                  <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Previous
                  </button>
                  <span style={{ padding: "6px 12px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
