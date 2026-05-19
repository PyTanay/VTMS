import React, { useEffect, useState } from "react";
import api from "../api";

interface AuditEntry {
  id: number;
  userId: number | null;
  user: { id: number; username: string; role: string } | null;
  action: string;
  entity_name: string;
  entity_id: number;
  old_value: string | null;
  new_value: string | null;
  timestamp: string;
}

const AuditLog: React.FC = () => {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entities, setEntities] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 30;

  useEffect(() => {
    loadFilters();
  }, []);
  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadFilters = async () => {
    try {
      const [entRes, actRes] = await Promise.all([api.get("/audit-logs/entities"), api.get("/audit-logs/actions")]);
      setEntities(entRes.data.data || []);
      setActions(actRes.data.data || []);
    } catch {
      /* non-critical */
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (entityFilter) params.set("entity", entityFilter);
      if (actionFilter) params.set("action", actionFilter);
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Audit Log Viewer</h2>

          <form onSubmit={handleSearch} className="flex-wrap" style={{ marginBottom: "16px" }}>
            <div>
              <label className="form-label">Entity</label>
              <select
                className="form-input"
                style={{ minWidth: "150px" }}
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
              >
                <option value="">All</option>
                {entities.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Action</label>
              <select
                className="form-input"
                style={{ minWidth: "150px" }}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All</option>
                {actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">From</label>
              <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">To</label>
              <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && <p style={{ color: "#dc2626", marginBottom: "12px" }}>{error}</p>}

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : logs.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No logs found.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>ID</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: "nowrap", color: "var(--text-secondary)", fontSize: "13px" }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 500 }}>{log.user?.username ?? "System"}</td>
                        <td>
                          <span
                            className={`badge ${log.action === "DELETE" ? "badge-danger" : log.action === "CREATE" ? "badge-success" : "badge-info"}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td>{log.entity_name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{log.entity_id}</td>
                        <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {log.new_value ? (
                            <details>
                              <summary style={{ cursor: "pointer", color: "var(--primary-accent)", fontSize: "13px" }}>
                                View data
                              </summary>
                              <pre
                                style={{
                                  fontSize: "11px",
                                  marginTop: "4px",
                                  whiteSpace: "pre-wrap",
                                  color: "var(--text-secondary)",
                                  maxHeight: "200px",
                                  overflow: "auto",
                                }}
                              >
                                {JSON.stringify(JSON.parse(log.new_value), null, 2)}
                              </pre>
                            </details>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex-between" style={{ marginTop: "16px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </button>
                  <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
