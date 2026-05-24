import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const AccountSettings: React.FC = () => {
  const { user, updateEmail } = useAuth();
  const { addToast } = useToast();
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(user?.email || "");
  const [savingEmail, setSavingEmail] = useState(false);

  const handleSaveEmail = async () => {
    if (!emailValue.trim()) return addToast("error", "Email cannot be empty");
    setSavingEmail(true);
    try {
      await updateEmail(emailValue.trim());
      addToast("success", "Email updated successfully");
      setEditingEmail(false);
    } catch (err: any) {
      addToast("error", err?.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Account Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "12px 20px", fontSize: "14px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Employee Name</span>
            <span style={{ fontWeight: 600 }}>{user?.employee?.name || user?.username || "-"}</span>

            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>EC Number (Username)</span>
            <span>{user?.employee?.employee_no || user?.username || "-"}</span>

            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Designation</span>
            <span>{user?.employee?.designation || "-"}</span>

            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Department</span>
            <span>{user?.employee?.department || "-"}</span>

            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Email</span>
            <span>
              {editingEmail ? (
                <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    className="form-input"
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    style={{ width: "250px" }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveEmail}
                    disabled={savingEmail}
                    style={{ fontSize: "12px", padding: "4px 12px" }}
                  >
                    {savingEmail ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setEditingEmail(false);
                      setEmailValue(user?.email || "");
                    }}
                    style={{ fontSize: "12px", padding: "4px 12px" }}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <span>
                  {user?.email || "-"}
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setEditingEmail(true);
                      setEmailValue(user?.email || "");
                    }}
                    style={{ marginLeft: "8px", fontSize: "11px", padding: "2px 8px" }}
                  >
                    ✏️ Edit
                  </button>
                </span>
              )}
            </span>

            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Role</span>
            <span className="badge badge-info" style={{ justifySelf: "start" }}>
              {user?.role?.replace(/_/g, " ") || "-"}
            </span>

            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Employee ID</span>
            <span>
              {user?.employee?.employee_no
                ? `EC: ${user.employee.employee_no}`
                : user?.employeeId
                  ? `#${user.employeeId}`
                  : "Not linked"}
            </span>
          </div>
          {user?.role === "RECOMMENDING_EMPLOYEE" && (
            <p style={{ marginTop: "16px", color: "var(--text-secondary)", fontSize: "13px" }}>
              As a recommending employee, you can create and manage applications for training candidates. Use the sidebar to navigate
              to Applications or My Tasks.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
