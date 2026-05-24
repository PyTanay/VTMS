import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ApprovalInbox: React.FC = () => {
  const navigate = useNavigate();
  const {} = useAuth();
  const { addToast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications", { params: { perPage: 100 } });
      const all = res.data.data || [];
      setApplications(all.filter((a: any) => a.status === "SUBMITTED" || a.status === "PENDING_APPROVAL"));
    } catch {
      addToast("error", "Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: "APPROVED" | "REJECTED") => {
    try {
      await api.patch(`/applications/${id}/status`, { status: action });
      addToast("success", `Application ${action === "APPROVED" ? "approved" : "rejected"}`);
      await loadPending();
    } catch {
      addToast("error", "Failed to update status");
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Approval Inbox</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", marginBottom: "16px", fontSize: "14px" }}>
            Review and approve/reject pending applications. Total: {applications.length}
          </p>

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : applications.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No pending approvals.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App No</th>
                    <th>Student</th>
                    <th>College</th>
                    <th>Branch</th>
                    <th>Requested Period</th>
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
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.college?.college_name || "-"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.branch?.branch_name || "-"}</td>
                      <td style={{ fontSize: "13px" }}>
                        {app.requested_from?.slice(0, 10)} to {app.requested_to?.slice(0, 10)}
                      </td>
                      <td>
                        <span className="badge badge-warning">{app.status.replace(/_/g, " ")}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAction(app.id, "APPROVED")}>
                            Approve
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: "#dc2626" }}
                            onClick={() => handleAction(app.id, "REJECTED")}
                          >
                            Reject
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/applications/${app.id}`)}>
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalInbox;
