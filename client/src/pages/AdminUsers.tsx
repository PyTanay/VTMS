import React, { useEffect, useState } from "react";
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
}

interface UserAction {
  type: "deactivate" | "reactivate" | "suspend";
  target: UserDetail;
}

const ROLES = ["ADMIN", "RECOMMENDING_EMPLOYEE", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE", "ED_GM_APPROVER", "APPLICANT"];

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: number; role: string } | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [search, setSearch] = useState("");
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
    if (!editingRole) return;
    setSavingRole(true);
    try {
      await api.put(`/users/${editingRole.id}/role`, { role: editingRole.role });
      setEditingRole(null);
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

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      u.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.employee?.employee_no?.toLowerCase().includes(search.toLowerCase()),
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
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(true)}>
                + Create User
              </button>
            )}
          </div>

          <div className="search-bar" style={{ marginBottom: "16px" }}>
            <input type="text" className="form-input" style={{ minWidth: "300px" }}
              placeholder="Search by username, email, role, employee name/code..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <button className="btn btn-primary btn-sm" onClick={fetchUsers} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {error && (
            <div style={{ padding: "12px 16px", background: "#fef2f2", borderRadius: "8px", color: "#991b1b", marginBottom: "16px", fontSize: "14px" }}>
              {error}
            </div>
          )}

          <Modal open={showCreateForm} title="Create New User" onClose={() => setShowCreateForm(false)}
            actions={
              <>
                <button className="btn btn-outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreateUser} disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </button>
              </>
            }>
            <div style={{ display: "grid", gap: "12px" }}>
              <div><label className="form-label">Username *</label>
                <input className="form-input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Unique username" style={{ width: "100%" }} /></div>
              <div><label className="form-label">Email *</label>
                <input className="form-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@gnfc.in" style={{ width: "100%" }} /></div>
              <div><label className="form-label">Password *</label>
                <input className="form-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 chars" style={{ width: "100%" }} /></div>
              <div><label className="form-label">Role</label>
                <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)} style={{ width: "100%" }}>
                  {ROLES.map((r) => (<option key={r} value={r}>{r.replace(/_/g, " ")}</option>))}
                </select></div>
            </div>
          </Modal>

          <Modal open={!!resetTarget} title={`Reset Password: ${resetTarget?.username || ""}`}
            onClose={() => { setResetTarget(null); setNewUserPassword(""); }}
            actions={
              <>
                <button className="btn btn-outline" onClick={() => { setResetTarget(null); setNewUserPassword(""); }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting || !newUserPassword.trim()}>
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
              </>
            }>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} placeholder="Enter new password" />
            </div>
          </Modal>

          <Modal open={!!confirmAction}
            title={confirmAction?.type === "deactivate" ? "Deactivate User" : confirmAction?.type === "reactivate" ? "Reactivate User" : confirmAction?.type === "suspend" ? "Suspend User" : ""}
            onClose={() => setConfirmAction(null)}
            actions={
              <>
                <button className="btn btn-outline" onClick={() => setConfirmAction(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAccountAction} disabled={actioning}>
                  {actioning ? "Confirming..." : "Confirm"}
                </button>
              </>
            }>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              {confirmAction?.type === "deactivate" && `Deactivate "${confirmAction?.target.username}"? They will not be able to log in.`}
              {confirmAction?.type === "reactivate" && `Reactivate "${confirmAction?.target.username}" — restore full access.`}
              {confirmAction?.type === "suspend" && `Suspend "${confirmAction?.target.username}" — temporarily disable account.`}
            </p>
          </Modal>

          <Modal open={!!deleteTarget} title="Delete User" onClose={() => setDeleteTarget(null)}
            actions={
              <>
                <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ background: "#dc2626", borderColor: "#dc2626" }} onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
              </>
            }>
            <p>Permanently delete <strong>{deleteTarget?.username}</strong>?<br />
              <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>The account will be soft-deleted.</span></p>
          </Modal>

          <Modal open={!!auditTarget} title={`Activity: ${auditTarget?.username || ""}`} onClose={() => setAuditTarget(null)} width="700px">
            {auditLoading ? (<p style={{ color: "var(--text-secondary)" }}>Loading...</p>)
              : auditLogs.length === 0 ? (<p style={{ color: "var(--text-secondary)" }}>No activity found.</p>)
              : (<div style={{ maxHeight: "400px", overflow: "auto" }}>
                  {auditLogs.map((log: any, i: number) => (
                    <div key={log.id || i} style={{ padding: "8px 0", borderBottom: i < auditLogs.length - 1 ? "1px solid var(--border-color)" : "none", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: 500 }}>{log.action}</span>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>
                        {log.entity_name} #{log.entity_id}
                        {log.old_value && ` | ${log.old_value.substring(0, 100)}`}
                        {log.new_value && ` -> ${log.new_value.substring(0, 100)}`}
                      </div>
                    </div>
                  ))}
                </div>)}
          </Modal>

          <Modal open={!!profilePicTarget} title="Upload Profile Picture" onClose={() => setProfilePicTarget(null)}
            actions={
              uploadingPic ? <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Uploading...</span>
              : (<div style={{ display: "flex", gap: "8px" }}>
                  <input type="file" accept="image/*" onChange={handleProfilePicUpload} />
                  <button className="btn btn-outline" onClick={() => setProfilePicTarget(null)}>Cancel</button>
                </div>)
            }>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Select a profile picture image file (JPG, PNG).</p>
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
                      <th>Username</th>
                      <th>Email</th>
                      <th>Employee</th>
                      <th>EC No</th>
                      <th>Department</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((u) => (
                      <tr key={u.id} style={{ opacity: !u.active ? 0.5 : 1, background: u.suspended ? "#fef2f2" : undefined }}>
                        <td style={{ color: "var(--text-secondary)" }}>{u.id}</td>
                        <td style={{ fontWeight: 500 }}>{u.username}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.email}</td>
                        <td>{u.employee?.name || "-"}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{u.employee?.employee_no || "-"}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.employee?.department || "-"}</td>
                        <td>
                          {isAdmin && editingRole?.id === u.id ? (
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              <select className="form-input" style={{ width: "180px", padding: "4px 8px", fontSize: "12px" }}
                                value={editingRole.role} onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value })}>
                                {ROLES.map((r) => (<option key={r} value={r}>{r.replace(/_/g, " ")}</option>))}
                              </select>
                              <button className="btn btn-primary btn-sm" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={handleRoleSave} disabled={savingRole}>Save</button>
                              <button className="btn btn-outline btn-sm" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => setEditingRole(null)}>Cancel</button>
                            </div>
                          ) : (<span className="badge badge-info">{u.role.replace(/_/g, " ")}</span>)}
                        </td>
                        <td>{u.suspended ? <span className="badge badge-danger">Suspended</span> : !u.active ? <span className="badge badge-default">Inactive</span> : <span className="badge badge-success">Active</span>}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        {isAdmin && (
                          <td>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {editingRole?.id !== u.id && (
                                <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px" }} onClick={() => setEditingRole({ id: u.id, role: u.role })}>Role</button>
                              )}
                              <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px" }} onClick={() => setResetTarget({ id: u.id, username: u.username })}>Pwd</button>
                              <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px" }} onClick={() => setProfilePicTarget(u.id)}>Photo</button>
                              {u.active && u.id !== currentUser?.id && (
                                <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px", color: "#dc2626" }} onClick={() => setConfirmAction({ type: "deactivate", target: u })}>Deactivate</button>
                              )}
                              {!u.active && (
                                <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px", color: "#16a34a" }} onClick={() => setConfirmAction({ type: "reactivate", target: u })}>Reactivate</button>
                              )}
                              {u.active && !u.suspended && u.id !== currentUser?.id && (
                                <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px", color: "#f59e0b" }} onClick={() => setConfirmAction({ type: "suspend", target: u })}>Suspend</button>
                              )}
                              <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px", color: "#6366f1" }} onClick={() => loadAuditLog(u)}>Activity</button>
                              <button className="btn btn-outline btn-sm" style={{ padding: "4px 6px", fontSize: "11px", color: "#dc2626" }} onClick={() => setDeleteTarget(u)}>Delete</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ marginTop: "12px", display: "flex", gap: "4px", justifyContent: "center" }}>
                  <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</button>
                  <span style={{ padding: "6px 12px", fontSize: "13px", color: "var(--text-secondary)" }}>Page {page} of {totalPages}</span>
                  <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
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