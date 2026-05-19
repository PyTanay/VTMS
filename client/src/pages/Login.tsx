import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="login-card" style={{ textAlign: "center" }}>
        <img src="/gnfc-logo-animated.svg" alt="GNFC VTMS" style={{ maxWidth: "280px", marginBottom: "24px" }} />

        <h2 style={{ marginBottom: "4px" }}>Welcome to VTMS</h2>
        <p style={{ marginBottom: "28px" }}>Vocational Training Management System</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                borderRadius: "8px",
                color: "#991b1b",
                fontSize: "14px",
                border: "1px solid #fecaca",
              }}
            >
              {error}
            </div>
          )}
          <div style={{ textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>
              Username or Employee Code
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username or EC number"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1a73e8")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#64748b", marginBottom: "4px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1a73e8")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #1a73e8, #0d47a1)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "opacity 0.15s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: "24px", fontSize: "12px", color: "#94a3b8" }}>Gujarat Narmada Valley Fertilizers & Chemicals Ltd.</p>
      </div>
    </div>
  );
};

export default Login;
