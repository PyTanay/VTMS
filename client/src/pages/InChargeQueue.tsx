import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const InChargeQueue: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/applications", { params: { perPage: 100 } });
        const all: any[] = res.data.data || [];
        const inChargeStatuses = [
          "SCRUTINIZED",
          "ASSIGNED_TO_INCHARGE",
          "PERMISSION_LETTER_SENT",
          "JOINING_PENDING",
          "DOCUMENTS_VERIFIED",
          "BIODATA_COMPLETED",
          "GATE_PASS_CREATED",
          "POSTED",
          "TRAINING_ACTIVE",
          "REPORT_SUBMITTED",
          "NO_DUES_PENDING",
        ];
        setTasks(all.filter((a) => inChargeStatuses.includes(a.status)));
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getNextAction = (status: string): { label: string; path: string } => {
    switch (status) {
      case "SCRUTINIZED":
      case "ASSIGNED_TO_INCHARGE":
        return { label: "Permission Letter", path: "/permission-letters" };
      case "PERMISSION_LETTER_SENT":
      case "JOINING_PENDING":
        return { label: "Verify Documents", path: "/document-verification" };
      case "DOCUMENTS_VERIFIED":
        return { label: "Biodata", path: "/applications" };
      case "BIODATA_COMPLETED":
      case "GATE_PASS_CREATED":
        return { label: "Posting", path: "/posting-planner" };
      case "POSTED":
      case "TRAINING_ACTIVE":
        return { label: "Certificate", path: "/certificates" };
      case "REPORT_SUBMITTED":
        return { label: "No Due", path: "/no-due" };
      default:
        return { label: "View", path: "/applications" };
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>In-Charge Work Queue</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                {tasks.length} items requiring your action
              </p>
            </div>
          </div>
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : tasks.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No pending tasks.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App No</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t: any) => {
                    const action = getNextAction(t.status);
                    return (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 500, fontSize: "13px" }}>{t.application_no}</td>
                        <td>
                          {t.student_name} {t.student_surname}
                        </td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: "11px" }}>
                            {t.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm" onClick={() => navigate(action.path)}>
                            {action.label}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InChargeQueue;
