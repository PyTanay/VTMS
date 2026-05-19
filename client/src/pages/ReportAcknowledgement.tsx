import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface AppItem {
  id: number;
  application_no: string;
  student_name: string;
  student_surname: string;
  branch?: { branch_name: string };
  college?: { college_name: string };
  status: string;
  report_submitted: boolean;
}

const ReportAcknowledgement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [applications, setApplications] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isInCharge = user?.role === "TRAINING_IN_CHARGE" || user?.role === "ADMIN" || user?.role === "TRAINING_CENTER_SECTION_HEAD";

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications", { params: { perPage: 200 } });
      const all: AppItem[] = res.data.data || [];
      setApplications(all.filter((a) => ["POSTED", "TRAINING_ACTIVE", "REPORT_SUBMITTED", "NO_DUES_PENDING"].includes(a.status)));
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    setSaving(id);
    try {
      await api.patch(`/applications/${id}/status`, { status: "REPORT_SUBMITTED" });
      await loadApplications();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to acknowledge");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Training Report Acknowledgement</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", marginBottom: "16px", fontSize: "14px" }}>
            Acknowledge receipt of training reports from trainees.
          </p>

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

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : applications.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No trainees pending report submission.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App No</th>
                    <th>Student</th>
                    <th>Branch</th>
                    <th>College</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 500, fontSize: "13px" }}>{app.application_no}</td>
                      <td>
                        {app.student_name} {app.student_surname}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.branch?.branch_name || "-"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.college?.college_name || "-"}</td>
                      <td>
                        <span
                          className={`badge ${app.status === "REPORT_SUBMITTED" ? "badge-success" : "badge-warning"}`}
                          style={{ fontSize: "11px" }}
                        >
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        {app.status === "REPORT_SUBMITTED" ? (
                          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>✓ Acknowledged</span>
                        ) : (
                          isInCharge && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleAcknowledge(app.id)}
                              disabled={saving === app.id}
                            >
                              {saving === app.id ? "..." : "Acknowledge Report"}
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>Total: {applications.length}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportAcknowledgement;
