import React, { useEffect, useState } from "react";
import api from "../api";

interface TimelineEntry {
  status: string;
  timestamp: string;
  duration?: string;
  isCurrent: boolean;
  isExecuted: boolean;
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

// Status colors using CSS variables for dark mode support
const STATUS_COLORS: Record<string, { bg: string; dot: string; text: string }> = {
  CREATED: { bg: "var(--info-bg)", dot: "var(--primary-accent)", text: "var(--info-text)" },
  DRAFT: { bg: "var(--default-bg)", dot: "#9ca3af", text: "var(--default-text)" },
  SUBMITTED: { bg: "var(--info-bg)", dot: "var(--primary-accent)", text: "var(--info-text)" },
  PENDING_APPROVAL: { bg: "var(--warning-bg)", dot: "#f59e0b", text: "var(--warning-text)" },
  APPROVED: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  REJECTED: { bg: "var(--danger-bg)", dot: "#dc2626", text: "var(--danger-text)" },
  RECEIVED_BY_TC: { bg: "var(--info-bg)", dot: "var(--primary-accent)", text: "var(--info-text)" },
  SCRUTINIZED: { bg: "var(--info-bg)", dot: "var(--primary-accent)", text: "var(--info-text)" },
  ASSIGNED_TO_INCHARGE: { bg: "var(--info-bg)", dot: "var(--primary-accent)", text: "var(--info-text)" },
  PERMISSION_LETTER_SENT: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  JOINING_PENDING: { bg: "var(--warning-bg)", dot: "#f59e0b", text: "var(--warning-text)" },
  DOCUMENTS_VERIFIED: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  BIODATA_COMPLETED: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  GATE_PASS_CREATED: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  POSTED: { bg: "var(--info-bg)", dot: "var(--primary-accent)", text: "var(--info-text)" },
  TRAINING_ACTIVE: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  NO_DUES_PENDING: { bg: "var(--warning-bg)", dot: "#f59e0b", text: "var(--warning-text)" },
  REPORT_SUBMITTED: { bg: "var(--info-bg)", dot: "var(--primary-accent)", text: "var(--info-text)" },
  CERTIFICATE_READY: { bg: "var(--warning-bg)", dot: "#f59e0b", text: "var(--warning-text)" },
  CERTIFICATE_ISSUED: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  TRAINING_COMPLETED: { bg: "var(--success-bg)", dot: "#16a34a", text: "var(--success-text)" },
  CLOSED: { bg: "var(--default-bg)", dot: "#9ca3af", text: "var(--default-text)" },
};

const formatDate = (ts: string): string => {
  if (!ts) return "";
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
            const colors = STATUS_COLORS[entry.status] || { bg: "var(--default-bg)", dot: "#9ca3af", text: "var(--default-text)" };
            const label = STATUS_LABELS[entry.status] || entry.status.replace(/_/g, " ");
            const isLast = index === data.timeline.length - 1;

            // Determine opacity and styling based on execution status
            const isPending = !entry.isExecuted;
            const opacity = isPending ? 0.5 : entry.isCurrent ? 1 : 0.8;
            const cardBg = isPending ? "var(--default-bg)" : entry.isCurrent ? "var(--nav-active-bg)" : "transparent";
            const cardBorder = `1px solid ${isPending ? "var(--border-color)" : entry.isCurrent ? colors.dot : "transparent"}`;

            return (
              <div
                key={index}
                style={{
                  position: "relative",
                  marginBottom: isLast ? 0 : "16px",
                  paddingLeft: "16px",
                  opacity,
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
                    background: isPending ? "#9ca3af" : colors.dot,
                    border: entry.isCurrent ? "3px solid #fff" : "2px solid #fff",
                    boxShadow: entry.isCurrent ? `0 0 0 3px ${colors.dot}40` : "none",
                    zIndex: 1,
                  }}
                />

                {/* Card */}
                <div
                  style={{
                    background: cardBg,
                    border: cardBorder,
                    borderRadius: "8px",
                    padding: entry.isCurrent || !isPending ? "10px 14px" : "8px 12px",
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
                          color: isPending ? "var(--text-secondary)" : colors.text,
                          background: isPending ? "var(--nav-hover)" : colors.bg,
                          padding: "2px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {label}
                        {entry.isCurrent ? " ← Current" : ""}
                        {isPending ? " ⏳" : ""}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{formatDate(entry.timestamp)}</span>
                    </div>
                    {entry.duration && !isPending && (
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
                  {entry.user && !isPending && (
                    <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
                      by {entry.user.employeeName || entry.user.username} ({entry.user.role.replace(/_/g, " ")})
                    </div>
                  )}
                  {isPending && (
                    <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>⏳ Not yet reached</div>
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
