import React, { useEffect, useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalApplications: number;
  activeTrainees: number;
  totalDepartments: number;
  pendingScrutiny: number;
  pendingPermission: number;
  pendingVerification: number;
  pendingPosting: number;
  pendingCertificate: number;
  pendingNoDue: number;
  activeEmployees: number;
  totalUsers: number;
  recentApplications: Array<{ id: number; application_no: string; student_name: string; status: string; createdAt: string }>;
  totalVisits: number;
  concurrentUsers: number;
  uniqueVisitorsToday: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    activeTrainees: 0,
    totalDepartments: 0,
    pendingScrutiny: 0,
    pendingPermission: 0,
    pendingVerification: 0,
    pendingPosting: 0,
    pendingCertificate: 0,
    pendingNoDue: 0,
    activeEmployees: 0,
    totalUsers: 0,
    recentApplications: [],
    totalVisits: 0,
    concurrentUsers: 0,
    uniqueVisitorsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, activeEmployeesRes, usersRes, appsRes, siteStatsRes] = await Promise.all([
          api.get("/applications/stats"),
          api.get("/employees/meta/active-count"),
          api.get("/users"),
          api.get("/applications"),
          api.get("/applications/site-stats"),
        ]);

        const allApps = appsRes.data.data || [];
        const pendingScrutinyCount = allApps.filter(
          (a: any) => a.status === "SUBMITTED" || a.status === "PENDING_APPROVAL" || a.status === "APPROVED",
        ).length;
        const pendingPermissionCount = allApps.filter(
          (a: any) => a.status === "SCRUTINIZED" || a.status === "ASSIGNED_TO_INCHARGE",
        ).length;
        const pendingVerificationCount = allApps.filter(
          (a: any) => a.status === "PERMISSION_LETTER_SENT" || a.status === "JOINING_PENDING",
        ).length;
        const pendingPostingCount = allApps.filter(
          (a: any) => a.status === "GATE_PASS_CREATED" || a.status === "BIODATA_COMPLETED",
        ).length;
        const pendingCertCount = allApps.filter(
          (a: any) => a.status === "TRAINING_COMPLETED" || a.status === "REPORT_SUBMITTED",
        ).length;
        const pendingNoDueCount = allApps.filter(
          (a: any) => a.status === "CERTIFICATE_ISSUED" || a.status === "NO_DUES_PENDING",
        ).length;

        setStats({
          ...statsRes.data.data,
          activeEmployees: activeEmployeesRes.data.data || 0,
          totalUsers: usersRes.data.data?.length || 0,
          pendingScrutiny: pendingScrutinyCount,
          pendingPermission: pendingPermissionCount,
          pendingVerification: pendingVerificationCount,
          pendingPosting: pendingPostingCount,
          pendingCertificate: pendingCertCount,
          pendingNoDue: pendingNoDueCount,
          recentApplications: allApps.slice(0, 5),
          totalVisits: siteStatsRes.data.data?.totalVisits || 0,
          concurrentUsers: siteStatsRes.data.data?.concurrentUsers || 0,
          uniqueVisitorsToday: siteStatsRes.data.data?.uniqueVisitorsToday || 0,
        });
      } catch {
        setError("Error fetching dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="page-gap">
        <div className="panel" style={{ padding: "16px 24px", borderLeft: "4px solid #dc2626", color: "#dc2626" }}>
          {error}
        </div>
      </div>
    );
  }

  const StatCard = ({
    label,
    value,
    accent,
    onClick,
  }: {
    label: string;
    value: number | string;
    accent: string;
    onClick?: () => void;
  }) => (
    <div
      className="stat-card"
      style={{ borderLeft: `4px solid ${accent}`, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: value?.toString().length > 4 ? "24px" : "32px" }}>
        {loading ? "..." : (value ?? 0)}
      </div>
    </div>
  );

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Welcome to VTMS Dashboard</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
                Vocational Training Management System — Gujarat Narmada Valley Fertilizers & Chemicals Ltd.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate("/applications/new")}>
              + New Application
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="stats-grid">
        <StatCard
          label="Total Applications"
          value={stats.totalApplications}
          accent="var(--primary-accent)"
          onClick={() => navigate("/applications")}
        />
        <StatCard label="Active Trainees" value={stats.activeTrainees} accent="#ec4895" />
        <StatCard label="Departments" value={stats.totalDepartments} accent="#10b981" />
        <StatCard label="Active Employees" value={stats.activeEmployees} accent="#8b5cf6" />
        <StatCard label="Registered Users" value={stats.totalUsers} accent="#f59e0b" onClick={() => navigate("/users")} />
        <StatCard label="Total Visits (30d)" value={stats.totalVisits} accent="#06b6d4" />
        <StatCard label="Concurrent Users" value={stats.concurrentUsers} accent="#10b981" />
        <StatCard label="Unique Visitors Today" value={stats.uniqueVisitorsToday} accent="#8b5cf6" />
      </div>

      {/* Pending Workflow Cards */}
      <div className="panel">
        <div className="panel-body">
          <h3 style={{ margin: "0 0 16px", fontSize: "15px" }}>Pending Workflow Actions</h3>
          <div className="stats-grid">
            <StatCard
              label="Pending Scrutiny"
              value={stats.pendingScrutiny}
              accent="#f59e0b"
              onClick={() => navigate("/applications")}
            />
            <StatCard
              label="Permission Letters"
              value={stats.pendingPermission}
              accent="#f97316"
              onClick={() => navigate("/permission-letters")}
            />
            <StatCard
              label="Doc Verification"
              value={stats.pendingVerification}
              accent="#3b82f6"
              onClick={() => navigate("/document-verification")}
            />
            <StatCard
              label="Pending Posting"
              value={stats.pendingPosting}
              accent="#8b5cf6"
              onClick={() => navigate("/posting-planner")}
            />
            <StatCard
              label="Certificates"
              value={stats.pendingCertificate}
              accent="#06b6d4"
              onClick={() => navigate("/certificates")}
            />
            <StatCard label="No Due Clearance" value={stats.pendingNoDue} accent="#ef4444" onClick={() => navigate("/no-due")} />
          </div>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "15px" }}>Recent Applications</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate("/applications")}>
              View All
            </button>
          </div>
          {loading ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading...</p>
          ) : stats.recentApplications.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No applications yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App No</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentApplications.map((app) => (
                    <tr key={app.id} onClick={() => navigate(`/applications/${app.id}`)} style={{ cursor: "pointer" }}>
                      <td style={{ fontWeight: 500 }}>{app.application_no}</td>
                      <td>{app.student_name}</td>
                      <td>
                        <span className="badge badge-default">{app.status}</span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
