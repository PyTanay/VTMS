import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface SyncResult {
  updatedCount: number;
  createdUserCount: number;
  createEmployeeUsers: boolean;
  errors?: string[];
}

interface SyncLogEntry {
  id: number;
  to_email: string;
  subject: string;
  body: string;
  sent_status: boolean;
  sent_at: string;
  error_message?: string | null;
}

const SamvadSync: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [nightlyEnabled, setNightlyEnabled] = useState(true);
  const [syncTime, setSyncTime] = useState("02:00");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [syncPhase, setSyncPhase] = useState<"idle" | "running" | "done" | "error">("idle");
  const wsRef = useRef<WebSocket | null>(null);

  const isAllowed = user?.role === "ADMIN" || user?.role === "TRAINING_CENTER_SECTION_HEAD";

  useEffect(() => {
    if (isAllowed) {
      loadLogs();
    }
  }, [isAllowed]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.get("/samvad/logs");
      setLogs(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoadingLogs(false);
    }
  };

  // Simulate progress since real SAMVAD sync takes time
  const simulateProgress = () => {
    setProgress(0);
    setProgressLabel("Connecting to SAMVAD...");
    setSyncPhase("running");

    const steps = [
      { at: 10, label: "Fetching employee data..." },
      { at: 25, label: "Processing batch 1/20..." },
      { at: 40, label: "Processing batch 5/20..." },
      { at: 55, label: "Processing batch 10/20..." },
      { at: 70, label: "Processing batch 15/20..." },
      { at: 85, label: "Upserting to database..." },
      { at: 95, label: "Creating user accounts..." },
      { at: 100, label: "Sync complete!" },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProgress(steps[stepIndex].at);
        setProgressLabel(steps[stepIndex].label);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    return interval;
  };

  const handleSync = async () => {
    if (!isAllowed) {
      setError("Permission denied.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    setResult(null);
    setSyncPhase("running");

    const progressInterval = simulateProgress();

    try {
      const response = await api.post("/samvad/sync");
      clearInterval(progressInterval);
      setProgress(100);
      setProgressLabel("Sync complete!");

      if (response.data?.success) {
        setMessage(response.data.message || "Sync completed.");
        setResult(response.data.data);
        setSyncPhase("done");
      } else {
        setError(response.data?.message || "Sync failed.");
        setSyncPhase("error");
      }
      await loadLogs();
    } catch (err: any) {
      clearInterval(progressInterval);
      setProgress(0);
      setProgressLabel("");
      setError(err.response?.data?.message || err.message || "Sync failed.");
      setSyncPhase("error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (syncPhase === "done") {
          setTimeout(() => setSyncPhase("idle"), 5000);
        }
      }, 1000);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.post("/samvad/settings", { enabled: nightlyEnabled, time: syncTime });
      alert(`Nightly sync ${nightlyEnabled ? "enabled" : "disabled"} at ${syncTime}`);
    } catch {
      alert("Failed to save settings");
    }
  };

  const getSyncLogContent = (log: SyncLogEntry) => {
    try {
      return JSON.stringify(JSON.parse(log.body), null, 2);
    } catch {
      return log.body;
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

  return (
    <div className="page-gap">
      {/* Sync Trigger Card */}
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>SAMVAD Employee Sync</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
            Sync employee data from SAMVAD HR system. This fetches, updates, and optionally creates user accounts for employees.
          </p>

          {!isAllowed ? (
            <p style={{ color: "var(--text-secondary)", marginTop: "16px" }}>Restricted to ADMIN and Section Head users.</p>
          ) : (
            <div style={{ marginTop: "20px" }}>
              {/* Progress Bar */}
              {syncPhase === "running" && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>{progressLabel}</span>
                    <span style={{ fontWeight: 600 }}>{progress}%</span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "#e2e8f0",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress}%`,
                        background: progressColor,
                        borderRadius: "4px",
                        transition: "width 0.3s ease, background 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              <button className="btn btn-primary" onClick={handleSync} disabled={loading} style={{ width: "fit-content" }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="spinner" />
                    Running sync...
                  </span>
                ) : (
                  "Run SAMVAD Sync Now"
                )}
              </button>

              {/* Result card */}
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
                      Auto-create users: <strong>{result.createEmployeeUsers ? "Enabled" : "Disabled"}</strong>
                    </div>
                    {result.errors && result.errors.length > 0 && (
                      <div>
                        Errors: <span style={{ color: "#dc2626" }}>{result.errors.length}</span>
                        <details>
                          <summary style={{ cursor: "pointer", color: "var(--primary-accent)", marginTop: "4px" }}>
                            View errors
                          </summary>
                          <pre
                            style={{
                              fontSize: "12px",
                              marginTop: "4px",
                              whiteSpace: "pre-wrap",
                              maxHeight: "200px",
                              overflow: "auto",
                            }}
                          >
                            {result.errors.join("\n")}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {message && !result && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px 16px",
                    background: "#dcfce7",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    color: "#166534",
                    fontWeight: 500,
                    fontSize: "14px",
                  }}
                >
                  {message}
                </div>
              )}
              {error && (
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
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Settings */}
      <div className="panel">
        <div className="panel-body">
          <h3 style={{ margin: "0 0 16px", fontSize: "15px" }}>Nightly Sync Schedule</h3>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label className="form-label">
                <input type="checkbox" checked={nightlyEnabled} onChange={(e) => setNightlyEnabled(e.target.checked)} /> Enable
                automatic nightly sync
              </label>
            </div>
            <div>
              <label className="form-label">Sync Time (24h)</label>
              <input
                type="time"
                className="form-input"
                style={{ width: "140px" }}
                value={syncTime}
                onChange={(e) => setSyncTime(e.target.value)}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSaveSettings}>
              Save Settings
            </button>
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
                        <th>Type</th>
                        <th>Details</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ color: "var(--text-secondary)", fontSize: "13px", whiteSpace: "nowrap" }}>
                            {new Date(log.sent_at).toLocaleString()}
                          </td>
                          <td>{log.subject.replace("SAMVAD Sync Error: ", "")}</td>
                          <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                            <details>
                              <summary style={{ cursor: "pointer", color: "var(--primary-accent)", fontSize: "13px" }}>
                                {log.body.slice(0, 80)}...
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
                                {getSyncLogContent(log)}
                              </pre>
                            </details>
                          </td>
                          <td>
                            <span className={`badge ${log.sent_status ? "badge-success" : "badge-danger"}`}>
                              {log.sent_status ? "Success" : "Failed"}
                            </span>
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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SamvadSync;
