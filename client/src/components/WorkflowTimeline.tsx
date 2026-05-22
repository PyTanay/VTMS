import React, { useEffect, useState } from "react";
import api from "../api";

interface TimelineEntry {
  status: string;
  timestamp: string;
  duration?: string;
  isCurrent: boolean;
  user: {
    id: number;
    username: string;
    role: string;
    employeeName: string | null;
  } | null;
}

interface TimelineData {
  currentStatus: string;
  timeline: TimelineEntry[];
  allStatuses: string[];
}

interface Props {
  applicationId: number;
}

const STATUS_LABELS: Record<string, string> = {
  CREATED: "Application Created",
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RECEIVED_BY_TC: "Received by Training Center",
  SCRUTINIZED: "Scrutinized",
  ASSIGNED_TO_INCHARGE: "Assigned to In-Charge",
  PERMISSION_LETTER_SENT: "Permission Letter Sent",
  JOINING_PENDING: "Joining Pending",
  DOCUMENTS_VERIFIED: "Documents Verified",
  BIODATA_COMPLETED: "Biodata Completed",
  GATE_PASS_CREATED: "Gate Pass Created",
  POSTED: "Posted",
  TRAINING_ACTIVE: "Training Active",
  NO_DUES_PENDING: "No Dues Pending",
  REPORT_SUBMITTED: "Report Submitted",
  CERTIFICATE_READY: "Certificate Ready",
  CERTIFICATE_ISSUED: "Certificate Issued",
  TRAINING_COMPLETED: "Training Completed",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
  CREATED: { bg: "#e0e7ff", dot: "#4f46e5", text: "#4338ca" },
  DRAFT: { bg: "#f3f4f6", dot: "#9ca3af", text: "#6b7280" },
  SUBMITTED: { bg: "#dbeafe", dot: "#2563eb", text: "#1e40af" },
  PENDING_APPROVAL: { bg: "#fef3c7", dot: "#f59e0b", text: "#b45309" },
  APPROVED: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  REJECTED: { bg: "#fee2e2", dot: "#dc2626", text: "#b91c1c" },
  RECEIVED_BY_TC: { bg: "#e0e7ff", dot: "#4f46e5", text: "#4338ca" },
  SCRUTINIZED: { bg: "#dbeafe", dot: "#2563eb", text: "#1e40af" },
  ASSIGNED_TO_INCHARGE: { bg: "#f3e8ff", dot: "#7c3aed", text: "#6d28d9" },
  PERMISSION_LETTER_SENT: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  JOINING_PENDING: { bg: "#fef3c7", dot: "#f59e0b", text: "#b45309" },
  DOCUMENTS_VERIFIED: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  BIODATA_COMPLETED: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  GATE_PASS_CREATED: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  POSTED: { bg: "#dbeafe", dot: "#2563eb", text: "#1e40af" },
  TRAINING_ACTIVE: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  NO_DUES_PENDING: { bg: "#fef3c7", dot: "#f59e0b", text: "#b45309" },
  REPORT_SUBMITTED: { bg: "#dbeafe", dot: "#2563eb", text: "#1e40af" },
  CERTIFICATE_READY: { bg: "#fef3c7", dot: "#f59e0b", text: "#b45309" },
  CERTIFICATE_ISSUED: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  TRAINING_COMPLETED: { bg: "#dcfce7", dot: "#16a34a", text: "#15803d" },
  CLOSED: { bg: "#f3f4f6", dot: "#9ca3af", text: "#6b7280" },
};

const formatDate = (ts: string): string => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const WorkflowTimeline: React.FC<Props> = ({ applicationId }) => {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/applications/${applicationId}/timeline`);
        setData(res.data.data);
      } catch {
        setError("Failed to load timeline");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <p style={{ color: "var(--text-secondary)" }}>Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="panel">
        <div className="panel-body">
          <p style={{ color: "#dc2626" }}>{error || "No timeline data"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <h3 style={{ margin: "0 0 16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          📋 Workflow Timeline
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              fontWeight: 400,
              background: "var(--nav-hover)",
              padding: "2px 10px",
              borderRadius: "12px",
            }}
          >
            {data.timeline.length} steps
          </span>
        </h3>

        <div style={{ position: "relative", paddingLeft: "24px" }}>
          {/* Vertical connector line */}
          <div
            style={{
              position: "absolute",
              left: "8px",
              top: "8px",
              bottom: "8px",
              width: "2px",
              background: "linear-gradient(to bottom, var(--primary-accent) 0%, #e5e7eb 100%)",
              borderRadius: "1px",
            }}
          />

          {data.timeline.map((entry, index) => {
            const colors = STATUS_COLORS[entry.status] || { bg: "#f3f4f6", dot: "#9ca3af", text: "#6b7280" };
            const label = STATUS_LABELS[entry.status] || entry.status.replace(/_/g, " ");
            const isLast = index === data.timeline.length - 1;

            return (
              <div
                key={index}
                style={{
                  position: "relative",
                  marginBottom: isLast ? 0 : "16px",
                  paddingLeft: "16px",
                  opacity: entry.isCurrent ? 1 : 0.7,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: "-20px",
                    top: "4px",
                    width: entry.isCurrent ? "16px" : "12px",
                    height: entry.isCurrent ? "16px" : "12px",
                    borderRadius: "50%",
                    background: colors.dot,
                    border: entry.isCurrent ? "3px solid #fff" : "2px solid #fff",
                    boxShadow: entry.isCurrent ? `0 0 0 3px ${colors.dot}40` : "none",
                    zIndex: 1,
                  }}
                />

                {/* Card */}
                <div
                  style={{
                    background: entry.isCurrent ? "var(--nav-active-bg)" : "transparent",
                    border: `1px solid ${entry.isCurrent ? colors.dot : "transparent"}`,
                    borderRadius: "8px",
                    padding: entry.isCurrent ? "10px 14px" : "0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: entry.isCurrent ? 700 : 500,
                          color: colors.text,
                          background: colors.bg,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {label}
                        {entry.isCurrent ? " ← Current" : ""}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{formatDate(entry.timestamp)}</span>
                    </div>
                    {entry.duration && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          whiteSpace: "nowrap",
                          background: "var(--nav-hover)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        ⏱ {entry.duration}
                      </span>
                    )}
                  </div>
                  {entry.user && (
                    <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
                      by {entry.user.employeeName || entry.user.username} ({entry.user.role.replace(/_/g, " ")})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowTimeline;
