import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useThemeMode } from "../context/ThemeContext";
import api from "../api";

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, changePassword } = useAuth();
  const { addToast } = useToast();
  const { mode, toggleTheme } = useThemeMode();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const res = await api.get("/applications", { params: { perPage: 1 } });
        const all: any[] = res.data.data || [];
        setPendingCounts({
          scrutiny: all.filter((a: any) => ["SUBMITTED", "PENDING_APPROVAL", "APPROVED"].includes(a.status)).length,
          permission: all.filter((a: any) => ["SCRUTINIZED", "ASSIGNED_TO_INCHARGE"].includes(a.status)).length,
          verification: all.filter((a: any) => ["PERMISSION_LETTER_SENT", "JOINING_PENDING"].includes(a.status)).length,
          posting: all.filter((a: any) => ["GATE_PASS_CREATED", "BIODATA_COMPLETED"].includes(a.status)).length,
          certificates: all.filter((a: any) => ["TRAINING_COMPLETED", "REPORT_SUBMITTED"].includes(a.status)).length,
          nodue: all.filter((a: any) => ["CERTIFICATE_ISSUED", "NO_DUES_PENDING"].includes(a.status)).length,
          approvals: all.filter((a: any) => a.status === "SUBMITTED" || a.status === "PENDING_APPROVAL").length,
        });
      } catch {}
    };
    loadCounts();
    const interval = setInterval(loadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleChangePassword = async () => {
    try {
      await changePassword(currentPw, newPw);
      addToast("success", "Password changed successfully");
      setShowPasswordModal(false);
      setCurrentPw("");
      setNewPw("");
    } catch (err: any) {
      addToast("error", err?.message || "Failed to change password");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const Icon = ({ path, size = 18 }: { path: string; size?: number }) => (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );

  const ICONS: Record<string, string> = {
    dashboard:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    applications:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    masters:
      "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    permission: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    verification: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    gatepass:
      "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    posting:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    certificate:
      "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    nodue:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    reports:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    audit:
      "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
    sync: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    tasks:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    inbox:
      "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4",
    scrutiny:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  };

  type NavItem = { text: string; path: string; icon: string; section: string; badge?: keyof typeof pendingCounts; roles?: string[] };

  const allItems: NavItem[] = [
    { text: "Dashboard", path: "/", icon: ICONS.dashboard, section: "Main" },
    {
      text: "My Tasks",
      path: "/my-tasks",
      icon: ICONS.tasks,
      section: "Main",
      roles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"],
    },
    { text: "Approval Inbox", path: "/approval-inbox", icon: ICONS.inbox, section: "Main", roles: ["ED_GM_APPROVER"] },
    {
      text: "In-Charge Queue",
      path: "/incharge-queue",
      icon: ICONS.tasks,
      section: "Main",
      badge: "scrutiny",
      roles: ["ADMIN", "TRAINING_IN_CHARGE", "TRAINING_CENTER_SECTION_HEAD"],
    },
    { text: "Applications", path: "/applications", icon: ICONS.applications, section: "Transactions" },
    { text: "Masters", path: "/masters", icon: ICONS.masters, section: "Transactions" },
    {
      text: "Scrutiny Queue",
      path: "/scrutiny-queue",
      icon: ICONS.scrutiny,
      section: "Transactions",
      badge: "scrutiny",
      roles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"],
    },
    { text: "Permission Letters", path: "/permission-letters", icon: ICONS.permission, section: "Transactions", badge: "permission" },
    {
      text: "Doc Verification",
      path: "/document-verification",
      icon: ICONS.verification,
      section: "Transactions",
      badge: "verification",
    },
    { text: "Gate Pass", path: "/gate-pass", icon: ICONS.gatepass, section: "Transactions" },
    { text: "Posting Planner", path: "/posting-planner", icon: ICONS.posting, section: "Transactions", badge: "posting" },
    {
      text: "Report Ack",
      path: "/report-acknowledgement",
      icon: ICONS.certificate,
      section: "Transactions",
      badge: "nodue",
    },
    {
      text: "Certificate Ack",
      path: "/certificate-acknowledgement",
      icon: ICONS.verification,
      section: "Transactions",
      badge: "certificates",
    },
    { text: "Certificates", path: "/certificates", icon: ICONS.certificate, section: "Transactions", badge: "certificates" },
    { text: "No Due Clearance", path: "/no-due", icon: ICONS.nodue, section: "Transactions", badge: "nodue" },
    { text: "Reports", path: "/reports", icon: ICONS.reports, section: "Reports" },
    { text: "Account", path: "/account", icon: ICONS.users, section: "Admin" },
    { text: "Audit Log", path: "/audit-log", icon: ICONS.audit, section: "Admin", roles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },
    { text: "Users", path: "/users", icon: ICONS.users, section: "Admin", roles: ["ADMIN"] },
    { text: "Role Mappings", path: "/role-mappings", icon: ICONS.users, section: "Admin", roles: ["ADMIN"] },
    {
      text: "Email Settings",
      path: "/email-settings",
      icon: ICONS.inbox,
      section: "Admin",
      roles: ["ADMIN"],
    },
    {
      text: "SAMVAD Sync",
      path: "/samvad-sync",
      icon: ICONS.sync,
      section: "Admin",
      roles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"],
    },
  ];

  const filteredItems = allItems.filter((i) => !i.roles || i.roles.includes(user?.role || ""));
  const sections = [...new Set(filteredItems.map((i) => i.section))];
  const sidebarWidth = collapsed ? "64px" : "250px";
  const iconSize = collapsed ? 24 : 17;

  return (
    <div className="app-container">
      <aside
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--secondary-bg)",
          borderRight: "1px solid var(--border-color)",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 100,
          overflow: "hidden",
          transition: "width 0.25s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: collapsed ? "12px 6px" : "14px 16px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/gnfc-logo.svg" alt="GNFC" style={{ height: "32px", borderRadius: "6px" }} />
              <div>
                <p style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>VTMS</p>
              </div>
            </div>
          )}
          {collapsed && <img src="/favicon.svg" alt="VT" style={{ width: "28px", height: "28px" }} />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", padding: "4px" }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"}
              />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflow: "auto", padding: collapsed ? "6px" : "6px 10px" }}>
          {sections.map((section) => (
            <React.Fragment key={section}>
              {!collapsed && (
                <div
                  style={{
                    padding: "12px 12px 4px",
                    fontSize: "10px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-secondary)",
                  }}
                >
                  {section}
                </div>
              )}
              {filteredItems
                .filter((i) => i.section === section)
                .map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    location.pathname.startsWith(item.path + "/") ||
                    (item.path !== "/" && location.pathname.startsWith(item.path));
                  const count = item.badge ? pendingCounts[item.badge] : 0;
                  return (
                    <a
                      key={item.text}
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.path);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: collapsed ? "0" : "10px",
                        padding: collapsed ? "10px 8px" : "8px 12px",
                        color: isActive ? "var(--primary-accent)" : "var(--text-secondary)",
                        textDecoration: "none",
                        borderRadius: "8px",
                        transition: "all 0.15s",
                        fontWeight: isActive ? 600 : 400,
                        fontSize: "13px",
                        background: isActive ? "var(--nav-active-bg)" : "transparent",
                        borderLeft: isActive && !collapsed ? "3px solid var(--primary-accent)" : "3px solid transparent",
                        margin: "2px 0",
                        justifyContent: collapsed ? "center" : "flex-start",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "var(--nav-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                      title={collapsed ? item.text : ""}
                    >
                      <Icon path={item.icon} size={iconSize} />
                      {!collapsed && <span style={{ flex: 1, whiteSpace: "nowrap" }}>{item.text}</span>}
                      {!collapsed && count > 0 && (
                        <span
                          style={{
                            background: "var(--primary-accent)",
                            color: "white",
                            borderRadius: "50%",
                            minWidth: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "0 4px",
                          }}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </a>
                  );
                })}
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--border-color)", padding: collapsed ? "8px 4px" : "12px 16px" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "12px",
                  flexShrink: 0,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                <p style={{ fontSize: "12px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{user?.username}</p>
                <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: 0 }}>{user?.role?.replace(/_/g, " ")}</p>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {!collapsed && (
              <>
                <button
                  onClick={toggleTheme}
                  className="btn btn-outline"
                  style={{ width: "100%", fontSize: "11px", padding: "6px", justifyContent: "center" }}
                  title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
                >
                  {mode === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn btn-outline"
                  style={{ width: "100%", fontSize: "11px", padding: "6px", justifyContent: "center" }}
                >
                  🔑 Password
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ width: "100%", fontSize: collapsed ? "16px" : "11px", padding: "6px", justifyContent: "center" }}
            >
              {collapsed ? "🚪" : "🚪 Logout"}
            </button>
          </div>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: "margin-left 0.25s ease",
        }}
      >
        <header
          style={{
            background: "var(--secondary-bg)",
            borderBottom: "1px solid var(--border-color)",
            padding: "0 24px",
            height: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              {filteredItems.find((i) => i.path === location.pathname)?.text || "VTMS"}
            </h1>
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </header>
        <div className="page-content animate-fade-in">
          <Outlet />
        </div>
      </main>

      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            style={{
              background: "var(--secondary-bg)",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Change Password</h3>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button className="btn btn-primary" onClick={handleChangePassword} disabled={!currentPw || !newPw}>
                Change
              </button>
              <button className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
