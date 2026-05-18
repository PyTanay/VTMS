import React, { useEffect, useState } from "react";
import api from "../api";

interface UserDetail {
  id: number;
  username: string;
  email: string;
  role: string;
  employeeId?: number | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    employee_no: string;
    name: string;
    department: string;
    designation: string;
  } | null;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/users");
        setUsers(response.data.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="glass-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2>User Management</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            View the current list of registered users and their associated employee details.
          </p>
        </div>
      </div>

      {loading ? (
        <p>Loading users…</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "860px" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding: "12px 8px" }}>ID</th>
                <th style={{ padding: "12px 8px" }}>Username</th>
                <th style={{ padding: "12px 8px" }}>Email</th>
                <th style={{ padding: "12px 8px" }}>Role</th>
                <th style={{ padding: "12px 8px" }}>Employee ID</th>
                <th style={{ padding: "12px 8px" }}>Employee Name</th>
                <th style={{ padding: "12px 8px" }}>Department</th>
                <th style={{ padding: "12px 8px" }}>Designation</th>
                <th style={{ padding: "12px 8px" }}>Created At</th>
                <th style={{ padding: "12px 8px" }}>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: "12px 8px" }}>{user.id}</td>
                  <td style={{ padding: "12px 8px" }}>{user.username}</td>
                  <td style={{ padding: "12px 8px" }}>{user.email}</td>
                  <td style={{ padding: "12px 8px" }}>{user.role}</td>
                  <td style={{ padding: "12px 8px" }}>{user.employeeId ?? "-"}</td>
                  <td style={{ padding: "12px 8px" }}>{user.employee?.name ?? "-"}</td>
                  <td style={{ padding: "12px 8px" }}>{user.employee?.department ?? "-"}</td>
                  <td style={{ padding: "12px 8px" }}>{user.employee?.designation ?? "-"}</td>
                  <td style={{ padding: "12px 8px" }}>{new Date(user.createdAt).toLocaleString()}</td>
                  <td style={{ padding: "12px 8px" }}>{new Date(user.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
