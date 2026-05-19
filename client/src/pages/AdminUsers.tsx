import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface UserDetail {
  id: number;
  username: string;
  email: string;
  role: string;
  employeeId?: number | null;
  createdAt: string;
  updatedAt: string;
  employee?: { id: number; employee_no: string; name: string; department: string; designation: string } | null;
}

const ROLES = ["ADMIN", "RECOMMENDING_EMPLOYEE", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE", "ED_GM_APPROVER", "APPLICANT"];

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingRole, setEditingRole] = useState<{ id: number; role: string } | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 15;

  // User creation modal
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("APPLICANT");
  const [creating, setCreating] = useState(false);

  // Password reset modal
  const [resetTarget, setResetTarget] = useState<{ id: number; username: string } | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Profile picture
  const [profilePicTarget, setProfilePicTarget] = useState<number | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);

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
      await fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update role");
    } finally {
      setSavingRole(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      return alert("Username, email, and password are required");
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
      await fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create user");
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
      alert(`Password reset for ${resetTarget.username}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to reset password");
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
      alert("Profile picture updated");
    } catch {
      alert("Failed to upload");
    } finally {
      setUploadingPic(false);
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
            <input
              type="text"
              className="form-input"
              style={{ minWidth: "300px" }}
              placeholder="Search by username, email, role, employee name/code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <button className="btn btn-primary btn-sm" onClick={fetchUsers} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

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

          {/* Create User Modal */}
          {showCreateForm && (
            <div className="panel" style={{ padding: "20px", marginBottom: "20px", border: "2px solid var(--primary-accent)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px" }}>Create New User</h3>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Username *</label>
                  <input
                    className="form-input"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Unique username"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    className="form-input"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@gnfc.in"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button className="btn btn-primary" onClick={handleCreateUser} disabled={creating}>
                  {creating ? "Creating..." : "Create User"}
                </button>
                <button className="btn btn-outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Password Reset Modal */}
          {resetTarget && (
            <div className="panel" style={{ padding: "20px", marginBottom: "20px", border: "2px solid #f59e0b" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px" }}>Reset Password: {resetTarget.username}</h3>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={{ maxWidth: "300px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button className="btn btn-primary" onClick={handleResetPassword} disabled={resetting || !newUserPassword.trim()}>
                  {resetting ? "Resetting..." : "Reset Password"}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setResetTarget(null);
                    setNewUserPassword("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
                      <th>Created</th>
                      {isAdmin && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((u) => (
                      <tr key={u.id}>
                        <td style={{ color: "var(--text-secondary)" }}>{u.id}</td>
                        <td style={{ fontWeight: 500 }}>{u.username}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.email}</td>
                        <td>{u.employee?.name || "-"}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{u.employee?.employee_no || "-"}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{u.employee?.department || "-"}</td>
                        <td>
                          {isAdmin && editingRole?.id === u.id ? (
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                              <select
                                className="form-input"
                                style={{ width: "180px", padding: "4px 8px", fontSize: "12px" }}
                                value={editingRole.role}
                                onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value })}
                              >
                                {ROLES.map((r) => (
                                  <option key={r} value={r}>
                                    {r.replace(/_/g, " ")}
                                  </option>
                                ))}
                              </select>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                onClick={handleRoleSave}
                                disabled={savingRole}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                                onClick={() => setEditingRole(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="badge badge-info">{u.role.replace(/_/g, " ")}</span>
                          )}
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td>
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {editingRole?.id !== u.id && (
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: "4px 6px", fontSize: "11px" }}
                                  onClick={() => setEditingRole({ id: u.id, role: u.role })}
                                >
                                  Role
                                </button>
                              )}
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: "4px 6px", fontSize: "11px" }}
                                onClick={() => setResetTarget({ id: u.id, username: u.username })}
                              >
                                Password
                              </button>
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ padding: "4px 6px", fontSize: "11px" }}
                                onClick={() => setProfilePicTarget(u.id)}
                              >
                                Photo
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Profile pic upload */}
              {profilePicTarget && (
                <div style={{ marginTop: "12px", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
                  <label className="form-label">Upload Profile Picture for User #{profilePicTarget}</label>
                  <input type="file" accept="image/*" onChange={handleProfilePicUpload} disabled={uploadingPic} />
                  <button className="btn btn-outline btn-sm" style={{ marginLeft: "8px" }} onClick={() => setProfilePicTarget(null)}>
                    Cancel
                  </button>
                </div>
              )}

              {/* Pagination */}
              <div className="flex-between" style={{ marginTop: "16px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredUsers.length)} of {filteredUsers.length}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`btn ${page === pageNum ? "btn-primary" : "btn-outline"} btn-sm`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span style={{ color: "var(--text-secondary)", alignSelf: "center" }}>...</span>}
                  <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
