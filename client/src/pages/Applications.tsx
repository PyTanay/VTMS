import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

interface ApplicationItem {
  id: number;
  application_no: string;
  student_name: string;
  student_email: string;
  student_mobile: string;
  status: string;
  college: { college_name: string } | null;
}

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/applications", { params: { search } });
      setApplications(response.data.data || []);
    } catch (err) {
      setError("Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loadApplications();
  };

  return (
    <div className="glass-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2>Applications</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Review and manage trainee applications.</p>
        </div>
        <Link className="premium-btn" to="/applications/new" style={{ padding: "12px 16px" }}>
          New Application
        </Link>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or application number"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "white",
          }}
        />
        <button className="premium-btn" style={{ padding: "12px 16px" }}>
          Search
        </button>
      </form>

      {loading ? (
        <p>Loading applications…</p>
      ) : error ? (
        <p style={{ color: "#f87171" }}>{error}</p>
      ) : applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "720px" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding: "12px 8px" }}>Application No</th>
                <th style={{ padding: "12px 8px" }}>Student</th>
                <th style={{ padding: "12px 8px" }}>Email</th>
                <th style={{ padding: "12px 8px" }}>Mobile</th>
                <th style={{ padding: "12px 8px" }}>College</th>
                <th style={{ padding: "12px 8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <Link to={`/applications/${app.id}`} style={{ color: "var(--primary-accent)", textDecoration: "underline" }}>
                      {app.application_no}
                    </Link>
                  </td>
                  <td style={{ padding: "12px 8px" }}>{app.student_name}</td>
                  <td style={{ padding: "12px 8px" }}>{app.student_email}</td>
                  <td style={{ padding: "12px 8px" }}>{app.student_mobile}</td>
                  <td style={{ padding: "12px 8px" }}>{app.college?.college_name ?? "-"}</td>
                  <td style={{ padding: "12px 8px" }}>{app.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Applications;
