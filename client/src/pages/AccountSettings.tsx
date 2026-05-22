import React from "react";
import { useAuth } from "../context/AuthContext";

const AccountSettings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 16px", fontSize: "18px" }}>Account Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "12px 20px", fontSize: "14px" }}>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Username</span>
            <span>{user?.username || "-"}</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Email</span>
            <span>{user?.email || "-"}</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Role</span>
            <span className="badge badge-info">{user?.role?.replace(/_/g, " ") || "-"}</span>
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Employee ID</span>
            <span>{user?.employeeId ? `#${user.employeeId}` : "Not linked"}</span>
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
