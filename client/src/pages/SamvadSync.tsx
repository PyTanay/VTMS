import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface SyncResult {
  updatedCount: number;
  createdUserCount: number;
  skippedCount: number;
  createEmployeeUsers: boolean;
  errors?: string[];
}

interface SyncLogEntry {
  id: number;
  level: string;
  message: string;
  details?: string | null;
  syncRunId?: string | null;
  createdAt: string;
}

const SamvadSync: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [syncPhase, setSyncPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const isAllowed = user?.role === "ADMIN";

  // SSE connection for live log following
  const startSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();
    }
    const baseUrl = (api.defaults.baseURL || "").replace(/\/api$/, "");
    const sse = new EventSource(`${baseUrl}/api/samvad/logs/stream`);
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        const logText = `[${new Date(log.createdAt).toLocaleTimeString()}] [${log.level}] ${log.message}${log.details ? ` - ${log.details}` : ""}`;
        setSyncLog((prev) => [...prev, logText]);
      } catch (e) {
        // Ignore parse errors
      }
    };

    sse.onerror = () => {
      sse.close();
    };
  };

  const stopSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  };

  useEffect(() => {
    if (isAllowed) loadLogs();
  }, [isAllowed]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [syncLog]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => stopSSE();
  }, []);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get("/samvad/logs");
      setLogs(res.data.data || []);
    } catch {
      /* silently fail */
    } finally {
      setLoadingLogs(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all sync logs?")) return;
    try {
      await api.delete("/samvad/logs");
      setLogs([]);
    } catch {
      /* silently fail */
    }
  };

  const addLog = (msg: string) => {
    setSyncLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSync = async () => {
    if (!isAllowed) {
      setError("Permission denied.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setSyncLog([]);
    setProgress(0);
    setProgressLabel("Starting...");
    setSyncPhase("running");

    // Start SSE for live log following
    startSSE();

    // Use a real progress interval based on phase, not fake simulation
    let realProgress = 0;
    const interval = window.setInterval(() => {
      // Slowly advance progress while the sync is running (up to 90%)
      if (realProgress < 90) {
        realProgress += Math.random() * 8 + 1; // 1-9% increments
        if (realProgress > 90) realProgress = 90;
        setProgress(Math.round(realProgress));
      }
    }, 2000);
    progressIntervalRef.current = interval;

    addLog("Starting SAMVAD employee sync...");
    addLog("Fetching data from SAMVAD server...");

    try {
      const response = await api.post("/samvad/sync");
      window.clearInterval(interval);
      progressIntervalRef.current = null;

      if (response.data?.success) {
        setProgress(100);
        setProgressLabel("Sync complete!");
        addLog(`✅ Sync complete! Updated ${response.data.data?.updatedCount || 0} records.`);
        if (response.data.data?.skippedCount) {
          addLog(`ℹ️ Skipped ${response.data.data.skippedCount} inactive employees.`);
        }
        setResult(response.data.data);
        setSyncPhase("done");
      } else {
        addLog(`❌ Sync failed: ${response.data?.message || "Unknown error"}`);
        setError(response.data?.message || "Sync failed.");
        setSyncPhase("error");
      }
      await loadLogs();
    } catch (err: any) {
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
      setProgress(0);
      setProgressLabel("");
      addLog(`❌ Error: ${err?.response?.data?.message || err?.message || "Sync failed"}`);
      setError(err?.response?.data?.message || err?.message || "Sync failed.");
      setSyncPhase("error");
    } finally {
      setLoading(false);
      stopSSE();
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "#dc2626";
      case "WARN":
        return "#f59e0b";
      default:
        return "#10b981";
    }
  };

  const progressColor =
    syncPhase === "running"
      ? "var(--primary-accent)"
      : syncPhase === "done"
        ? "#10b981"
        : syncPhase === "error"
          ? "#dc2626"
          : "#e2e8f0";

  if (!isAllowed) {
    return (
      <div className="page-gap">
        <div className="panel">
          <div className="panel-body">
            <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>SAMVAD Employee Sync</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "16px" }}>Restricted to ADMIN users only.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-gap">
      {/* Sync Trigger */}
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>SAMVAD Employee Sync</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
            Sync employee data from SAMVAD HR system. ADMIN only.
          </p>

          <div style={{ marginTop: "20px" }}>
            {syncPhase === "running" && (
              <div style={{ marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{progressLabel}</span>
                  <span style={{ fontWeight: 600 }}>{progress}%</span>
                </div>
                <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: progressColor,
                      borderRadius: "4px",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
            )}

            <button className="btn btn-primary" onClick={handleSync} disabled={loading} style={{ width: "fit-content" }}>
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="spinner" /> Running sync...
                </span>
              ) : (
                "Run SAMVAD Sync Now"
              )}
            </button>

            {/* Live Log during sync */}
            {syncLog.length > 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#0f172a",
                  borderRadius: "8px",
                  maxHeight: "200px",
                  overflow: "auto",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
              >
                {syncLog.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}

            {result && (
              <div className="panel" style={{ marginTop: "16px", padding: "20px", borderLeft: "4px solid #10b981" }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "15px", color: "#10b981" }}>✅ Sync Result</h3>
                <div style={{ display: "grid", gap: "8px", fontSize: "14px" }}>
                  <div>
                    Employees updated: <strong>{result.updatedCount}</strong>
                  </div>
                  <div>
                    New users created: <strong>{result.createdUserCount}</strong>
                  </div>
                  <div>
                    Skipped (inactive): <strong>{result.skippedCount}</strong>
                  </div>
                  <div>
                    Auto-create users: <strong>{result.createEmployeeUsers ? "Enabled" : "Disabled"}</strong>
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div>
                      Errors: <span style={{ color: "#dc2626" }}>{result.errors.length}</span>
                      <details>
                        <summary style={{ cursor: "pointer", color: "var(--primary-accent)", marginTop: "4px" }}>View errors</summary>
                        <pre
                          style={{ fontSize: "12px", marginTop: "4px", whiteSpace: "pre-wrap", maxHeight: "200px", overflow: "auto" }}
                        >
                          {result.errors.join("\n")}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && !result && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "14px 16px",
                  background: "#fef2f2",
                  borderRadius: "8px",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontWeight: 500,
                  fontSize: "14px",
                }}
              >
                ❌ {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Logs */}
      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "15px" }}>Sync History & Logs</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowLogs(!showLogs)}>
                {showLogs ? "Hide Logs" : "Show Logs"}
              </button>
              <button className="btn btn-outline btn-sm" onClick={loadLogs} disabled={loadingLogs}>
                Refresh
              </button>
              <button className="btn btn-danger btn-sm" onClick={clearLogs} disabled={loadingLogs || logs.length === 0}>
                Clear Logs
              </button>
            </div>
          </div>

          {showLogs && (
            <>
              {loadingLogs ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading logs...</p>
              ) : logs.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No sync logs found.</p>
              ) : (
                <div className="table-wrap" style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Level</th>
                        <th>Message</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ color: "var(--text-secondary)", fontSize: "13px", whiteSpace: "nowrap" }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <span
                              className={`badge badge-${log.level === "ERROR" ? "error" : log.level === "WARN" ? "warning" : "success"}`}
                            >
                              {log.level}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>{log.message}</td>
                          <td style={{ maxWidth: "300px" }}>
                            {log.details ? (
                              <details>
                                <summary style={{ cursor: "pointer", color: "var(--primary-accent)", fontSize: "13px" }}>
                                  View details
                                </summary>
                                <pre
                                  style={{
                                    fontSize: "11px",
                                    marginTop: "4px",
                                    whiteSpace: "pre-wrap",
                                    maxHeight: "150px",
                                    overflow: "auto",
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {log.details}
                                </pre>
                              </details>
                            ) : (
                              <span style={{ color: "var(--text-secondary)" }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .badge-error { background: #fee2e2; color: #991b1b; }
      `}</style>
    </div>
  );
};

export default SamvadSync;
