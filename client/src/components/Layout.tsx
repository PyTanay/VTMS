import React from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const isAdminOrSectionHead = isAdmin || user?.role === "TRAINING_CENTER_SECTION_HEAD";

  const menuItems = [
    { text: "Dashboard", path: "/" },
    { text: "Applications", path: "/applications" },
    ...(isAdmin ? [{ text: "Users", path: "/users" }] : []),
    ...(isAdminOrSectionHead ? [{ text: "SAMVAD Sync", path: "/samvad-sync" }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="app-container">
      <aside className="sidebar glass-panel" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: "none" }}>
        <div style={{ marginBottom: "40px", padding: "0 16px" }}>
          <h2
            style={{ color: "var(--primary-accent)", fontSize: "24px", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}
          >
            <span
              style={{
                display: "inline-block",
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))",
              }}
            ></span>
            VTMS
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "4px" }}>Vocational Training</p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <a
                key={item.text}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                {item.text}
              </a>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", padding: "16px", background: "var(--bg-panel)", borderRadius: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--secondary-accent), var(--primary-accent))",
              }}
            ></div>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "white" }}>{user?.username ?? "User"}</p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>{user?.role ?? "Role"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="premium-btn" style={{ width: "100%", marginTop: "16px", padding: "10px 12px" }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header
          className="glass-panel"
          style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{ fontSize: "20px", margin: 0, color: "white" }}>
              {menuItems.find((m) => m.path === location.pathname)?.text || "Dashboard"}
            </h1>
          </div>
        </header>

        <div className="animate-fade-in" style={{ flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
