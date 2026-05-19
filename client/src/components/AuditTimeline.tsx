import React, { useEffect, useState } from "react";
import api from "../api";

interface AuditEntry {
  id: number;
  action: string;
  entity_name: string;
  entity_id: number;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
  user: { id: number; username: string; role: string } | null;
}

interface Props {
  entityName: string;
  entityId: number;
}

const AuditTimeline: React.FC<Props> = ({ entityName, entityId }) => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/audit-logs?entity=${entityName}&entityId=${entityId}&perPage=20`);
        setLogs(res.data.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entityName, entityId]);

  if (loading) return <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Loading timeline...</p>;
  if (logs.length === 0) return <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No audit history available.</p>;

  const getColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "#10b981";
      case "UPDATE":
      case "STATUS_CHANGE":
        return "#3b82f6";
      case "DELETE":
        return "#ef4444";
      case "GENERATE":
        return "#8b5cf6";
      default:
        return "#64748b";
    }
  };

  return (
    <div style={{ position: "relative", paddingLeft: "24px" }}>
      {/* Vertical line */}
      <div style={{ position: "absolute", left: "8px", top: "4px", bottom: "4px", width: "2px", background: "var(--border-color)" }} />
      {logs.map((log) => (
        <div key={log.id} style={{ position: "relative", paddingBottom: "16px" }}>
          {/* Dot */}
          <div
            style={{
              position: "absolute",
              left: "-18px",
              top: "4px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: getColor(log.action),
              border: "2px solid var(--secondary-bg)",
            }}
          />
          <div style={{ fontSize: "13px" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600, fontSize: "12px" }}>{log.user?.username || "System"}</span>
              <span
                style={{
                  color: getColor(log.action),
                  fontWeight: 500,
                  fontSize: "11px",
                  background: `${getColor(log.action)}15`,
                  padding: "1px 6px",
                  borderRadius: "4px",
                }}
              >
                {log.action}
              </span>
              <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>
              {log.entity_name} #{log.entity_id}
              {log.new_value && (
                <details style={{ marginTop: "4px" }}>
                  <summary style={{ cursor: "pointer", color: "var(--primary-accent)", fontSize: "11px" }}>View changes</summary>
                  <pre
                    style={{
                      fontSize: "10px",
                      marginTop: "2px",
                      whiteSpace: "pre-wrap",
                      maxHeight: "100px",
                      overflow: "auto",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {JSON.stringify(JSON.parse(log.new_value), null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditTimeline;
