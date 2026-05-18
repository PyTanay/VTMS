import React, { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface SyncResult {
  updatedCount: number;
  createdUserCount: number;
  createEmployeeUsers: boolean;
}

const SamvadSync: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<SyncResult | null>(null);

  const isAllowed = user?.role === "ADMIN" || user?.role === "TRAINING_CENTER_SECTION_HEAD";

  const handleSync = async () => {
    if (!isAllowed) {
      setError("You do not have permission to run SAMVAD sync.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setResult(null);

    try {
      const response = await api.post("/samvad/sync");
      if (response.data?.success) {
        setMessage(response.data.message || "SAMVAD sync completed.");
        setResult(response.data.data);
      } else {
        setError(response.data?.message || "SAMVAD sync failed.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "SAMVAD sync failed.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "24px" }}>
      <h2>SAMVAD Sync</h2>
      <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Trigger a manual SAMVAD employee sync and review results.</p>

      {!isAllowed ? (
        <div style={{ marginTop: "24px" }}>
          <p style={{ color: "var(--text-secondary)" }}>This action is restricted to ADMIN and TRAINING_CENTER_SECTION_HEAD users.</p>
        </div>
      ) : (
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <button
            onClick={handleSync}
            disabled={loading}
            style={{
              width: "fit-content",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "none",
              background: "var(--primary-accent)",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Running SAMVAD sync..." : "Run SAMVAD Sync"}
          </button>

          {message && (
            <div style={{ padding: "16px", background: "rgba(16, 185, 129, 0.12)", borderRadius: "12px" }}>
              <p style={{ margin: 0, color: "#047857", fontWeight: 600 }}>{message}</p>
            </div>
          )}

          {error && (
            <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.12)", borderRadius: "12px" }}>
              <p style={{ margin: 0, color: "#991b1b", fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {result && (
            <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
              <div className="glass-panel" style={{ padding: "20px" }}>
                <h3 style={{ margin: 0, color: "var(--primary-accent)" }}>Sync Result</h3>
                <div style={{ marginTop: "12px", display: "grid", gap: "8px" }}>
                  <div>Total employees updated: {result.updatedCount}</div>
                  <div>New employee users created: {result.createdUserCount}</div>
                  <div>Employee user creation enabled: {result.createEmployeeUsers ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SamvadSync;
