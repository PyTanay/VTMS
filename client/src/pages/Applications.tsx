import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface ApplicationItem {
  id: number;
  application_no: string;
  student_name: string;
  student_surname: string;
  student_email: string;
  student_mobile: string;
  status: string;
  applicant_type: string;
  application_date: string;
  college: { college_name: string } | null;
  category: { name: string } | null;
  branch: { branch_name: string } | null;
  recommending_employee?: { name: string } | null;
}

const statusStyles: Record<string, string> = {
  DRAFT: "badge-default",
  SUBMITTED: "badge-info",
  PENDING_APPROVAL: "badge-warning",
  APPROVED: "badge-success",
  REJECTED: "badge-danger",
  SCRUTINIZED: "badge-info",
  PERMISSION_LETTER_SENT: "badge-info",
  JOINING_PENDING: "badge-warning",
  DOCUMENTS_VERIFIED: "badge-success",
  BIODATA_COMPLETED: "badge-success",
  GATE_PASS_CREATED: "badge-success",
  POSTED: "badge-success",
  TRAINING_ACTIVE: "badge-success",
  TRAINING_COMPLETED: "badge-success",
  CLOSED: "badge-default",
};

const Applications: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 15;

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { perPage };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.applicantType = typeFilter;
      params.page = page;

      const response = await api.get("/applications", { params });
      setApplications(response.data.data || []);
      setTotalCount(response.data.meta?.totalCount || 0);
    } catch {
      setError("Unable to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [page, statusFilter, typeFilter]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    loadApplications();
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          {/* Header */}
          <div className="action-bar" style={{ marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Applications</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                Review and manage trainee applications. Total: {totalCount}
              </p>
            </div>
            {user?.role !== "RECOMMENDING_EMPLOYEE" && (
              <Link className="btn btn-primary" to="/applications/new">
                + New Application
              </Link>
            )}
          </div>

          {/* RBAC Scope Indicator */}
          {user?.role === "RECOMMENDING_EMPLOYEE" && (
            <div
              style={{
                background: "var(--primary-accent-light, #e0f2fe)",
                border: "1px solid var(--primary-accent, #2563eb)",
                borderRadius: "8px",
                padding: "10px 16px",
                marginBottom: "16px",
                fontSize: "14px",
                color: "var(--primary-accent, #2563eb)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🔍</span>
              <span>
                <strong>Scope:</strong> Showing only applications you recommended. To see all applications, contact an administrator.
              </span>
            </div>
          )}

          {/* Filters */}
          <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: "16px" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or application no..."
              className="form-input"
              style={{ minWidth: "250px", flex: 1 }}
            />
            <select
              className="form-input"
              style={{ width: "180px" }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {Object.keys(statusStyles).map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <select
              className="form-input"
              style={{ width: "160px" }}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="EMPLOYEE_WARD">Employee Ward</option>
              <option value="OTHER_REFERENCE">Other Reference</option>
            </select>
            <button className="btn btn-primary" type="submit">
              Search
            </button>
          </form>

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading applications...</p>
          ) : error ? (
            <p style={{ color: "#dc2626" }}>{error}</p>
          ) : applications.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No applications found.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>App No</th>
                      <th>Student</th>
                      <th>Email / Mobile</th>
                      <th>College</th>
                      <th>Branch</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <Link
                            to={`/applications/${app.id}`}
                            style={{ color: "var(--primary-accent)", fontWeight: 500, fontSize: "13px" }}
                          >
                            {app.application_no}
                          </Link>
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          {app.student_name} {app.student_surname}
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                          <div>{app.student_email}</div>
                          <div>{app.student_mobile}</div>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.college?.college_name ?? "-"}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.branch?.branch_name ?? "-"}</td>
                        <td>
                          <span className="badge badge-default" style={{ fontSize: "11px" }}>
                            {app.applicant_type === "EMPLOYEE_WARD" ? "Employee" : "Other"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusStyles[app.status] || "badge-default"}`} style={{ fontSize: "11px" }}>
                            {app.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px", whiteSpace: "nowrap" }}>
                          {new Date(app.application_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination — Fixed dynamic sliding window */}
              <div className="flex-between" style={{ marginTop: "16px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount}
                </span>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    ‹ Prev
                  </button>
                  {totalPages <= 7 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`btn ${page === p ? "btn-primary" : "btn-outline"} btn-sm`}
                        onClick={() => setPage(p)}
                        style={{ minWidth: "34px" }}
                      >
                        {p}
                      </button>
                    ))
                  ) : (
                    <>
                      {page > 3 && (
                        <button className="btn btn-outline btn-sm" onClick={() => setPage(1)} style={{ minWidth: "34px" }}>
                          1
                        </button>
                      )}
                      {page > 4 && <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>…</span>}
                      {[page - 2, page - 1, page, page + 1, page + 2]
                        .filter((p) => p >= 1 && p <= totalPages)
                        .map((p) => (
                          <button
                            key={p}
                            className={`btn ${page === p ? "btn-primary" : "btn-outline"} btn-sm`}
                            onClick={() => setPage(p)}
                            style={{ minWidth: "34px" }}
                          >
                            {p}
                          </button>
                        ))}
                      {page < totalPages - 3 && <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>…</span>}
                      {page < totalPages - 2 && (
                        <button className="btn btn-outline btn-sm" onClick={() => setPage(totalPages)} style={{ minWidth: "34px" }}>
                          {totalPages}
                        </button>
                      )}
                    </>
                  )}
                  <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next ›
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

export default Applications;
