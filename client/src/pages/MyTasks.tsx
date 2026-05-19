import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const MyTasks: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingScrutiny, setPendingScrutiny] = useState<any[]>([]);
  const [pendingPermission, setPendingPermission] = useState<any[]>([]);
  const [pendingVerification, setPendingVerification] = useState<any[]>([]);
  const [pendingPosting, setPendingPosting] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications", { params: { perPage: 200 } });
      const all: any[] = res.data.data || [];
      setPendingScrutiny(all.filter((a) => ["SUBMITTED", "PENDING_APPROVAL", "APPROVED"].includes(a.status)));
      setPendingPermission(all.filter((a) => ["SCRUTINIZED", "ASSIGNED_TO_INCHARGE"].includes(a.status)));
      setPendingVerification(all.filter((a) => ["PERMISSION_LETTER_SENT", "JOINING_PENDING"].includes(a.status)));
      setPendingPosting(all.filter((a) => ["GATE_PASS_CREATED", "BIODATA_COMPLETED"].includes(a.status)));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const TaskCard = ({
    title,
    count,
    items,
    path,
    color,
  }: {
    title: string;
    count: number;
    items: any[];
    path: string;
    color: string;
  }) => (
    <div className="panel" style={{ cursor: "pointer" }} onClick={() => navigate(path)}>
      <div className="panel-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "15px" }}>{title}</h3>
          <span
            style={{
              background: color,
              color: "white",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {count}
          </span>
        </div>
        {loading ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Loading...</p>
        ) : count === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No pending items</p>
        ) : (
          <div style={{ maxHeight: "200px", overflow: "auto" }}>
            {items.slice(0, 5).map((item: any) => (
              <div
                key={item.id}
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border-color)",
                  fontSize: "13px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 500 }}>{item.student_name}</span>
                <span style={{ color: "var(--text-secondary)" }}>{item.application_no}</span>
              </div>
            ))}
            {count > 5 && <p style={{ color: "var(--primary-accent)", fontSize: "12px", marginTop: "4px" }}>+{count - 5} more</p>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: 0, fontSize: "18px" }}>My Tasks</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
            Welcome back, {user?.username}. Here are your pending workflow items.
          </p>
        </div>
      </div>
      <div className="stats-grid">
        {(user?.role === "ADMIN" || user?.role === "TRAINING_CENTER_SECTION_HEAD") && (
          <TaskCard
            title="Pending Scrutiny"
            count={pendingScrutiny.length}
            items={pendingScrutiny}
            path="/applications"
            color="#f59e0b"
          />
        )}
        {(user?.role === "ADMIN" || user?.role === "TRAINING_IN_CHARGE") && (
          <>
            <TaskCard
              title="Permission Letters"
              count={pendingPermission.length}
              items={pendingPermission}
              path="/permission-letters"
              color="#f97316"
            />
            <TaskCard
              title="Document Verification"
              count={pendingVerification.length}
              items={pendingVerification}
              path="/document-verification"
              color="#3b82f6"
            />
            <TaskCard
              title="Pending Posting"
              count={pendingPosting.length}
              items={pendingPosting}
              path="/posting-planner"
              color="#8b5cf6"
            />
          </>
        )}
        {user?.role === "ED_GM_APPROVER" && (
          <TaskCard
            title="Pending Approvals"
            count={pendingScrutiny.length}
            items={pendingScrutiny}
            path="/approval-inbox"
            color="#10b981"
          />
        )}
      </div>
    </div>
  );
};

export default MyTasks;
