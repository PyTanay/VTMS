import React, { useState, useEffect } from "react";
import api from "../api";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  SCRUTINIZED: "Scrutinized",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PERMISSION_LETTER_SENT: "Permission Letter Sent",
  JOINING_PENDING: "Joining Pending",
  TRAINING_ACTIVE: "Training Active",
  TRAINING_COMPLETED: "Training Completed",
  REPORT_SUBMITTED: "Report Submitted",
  CERTIFICATE_ISSUED: "Certificate Issued",
  NO_DUES_PENDING: "No Dues Pending",
  COMPLETED: "Completed",
  WITHDRAWN: "Withdrawn",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#6b7280",
  SUBMITTED: "#3b82f6",
  SCRUTINIZED: "#8b5cf6",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  PERMISSION_LETTER_SENT: "#f59e0b",
  JOINING_PENDING: "#f97316",
  TRAINING_ACTIVE: "#06b6d4",
  TRAINING_COMPLETED: "#10b981",
  REPORT_SUBMITTED: "#6366f1",
  CERTIFICATE_ISSUED: "#14b8a6",
  NO_DUES_PENDING: "#eab308",
  COMPLETED: "#22c55e",
  WITHDRAWN: "#6b7280",
};

const StudentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"apply" | "track">("apply");

  // ── Masters data ──
  const [masters, setMasters] = useState<{
    categories: any[];
    branches: any[];
    colleges: any[];
  }>({ categories: [], branches: [], colleges: [] });

  useEffect(() => {
    api
      .get("/public/masters")
      .then((res) => {
        if (res.data?.success) {
          setMasters(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  // ── Apply form ──
  const [form, setForm] = useState({
    student_surname: "",
    student_name: "",
    student_father_name: "",
    student_email: "",
    student_mobile: "",
    categoryId: "",
    branchId: "",
    year_of_study: "",
    semester: "",
    collegeId: "",
    requested_from: "",
    requested_to: "",
    applicant_type: "EMPLOYEE_WARD",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; appNo?: string } | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const payload: Record<string, any> = { ...form };
      if (payload.categoryId) payload.categoryId = Number(payload.categoryId);
      if (payload.branchId) payload.branchId = Number(payload.branchId);
      if (payload.collegeId) payload.collegeId = Number(payload.collegeId);
      if (payload.year_of_study) payload.year_of_study = Number(payload.year_of_study);
      if (payload.semester) payload.semester = Number(payload.semester);

      const res = await api.post("/public/applications", payload);
      if (res.data?.success) {
        setSubmitResult({
          success: true,
          message: res.data.data.message,
          appNo: res.data.data.application_no,
        });
        setForm({
          student_surname: "",
          student_name: "",
          student_father_name: "",
          student_email: "",
          student_mobile: "",
          categoryId: "",
          branchId: "",
          year_of_study: "",
          semester: "",
          collegeId: "",
          requested_from: "",
          requested_to: "",
          applicant_type: "EMPLOYEE_WARD",
        });
      } else {
        setSubmitResult({ success: false, message: res.data?.message || "Submission failed" });
      }
    } catch (err: any) {
      setSubmitResult({
        success: false,
        message: err?.response?.data?.message || err?.message || "Network error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Track ──
  const [trackQuery, setTrackQuery] = useState({ application_no: "", email: "" });
  const [tracking, setTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<any[] | null>(null);
  const [trackError, setTrackError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setTracking(true);
    setTrackError("");
    setTrackResult(null);
    try {
      const params: Record<string, string> = {};
      if (trackQuery.application_no) params.application_no = trackQuery.application_no;
      if (trackQuery.email) params.email = trackQuery.email;
      const res = await api.get("/public/applications/track", { params });
      if (res.data?.success) {
        setTrackResult(res.data.data);
      } else {
        setTrackError(res.data?.message || "No results found");
      }
    } catch (err: any) {
      setTrackError(err?.response?.data?.message || "Failed to fetch status");
    } finally {
      setTracking(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    background: "var(--input-bg)",
    color: "var(--text-primary)",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <img src="/gnfc-logo.svg" alt="GNFC" style={{ height: 48, marginBottom: 8 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          Vocational Training Management System
        </h1>
        <p style={{ color: "var(--text-secondary)", margin: "4px 0 0" }}>Gujarat Narmada Valley Fertilizers & Chemicals Limited</p>
      </div>

      {/* Tab buttons */}
      <div
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 24,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--border-color)",
        }}
      >
        <button
          onClick={() => setActiveTab("apply")}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            cursor: "pointer",
            fontWeight: activeTab === "apply" ? 600 : 400,
            background: activeTab === "apply" ? "var(--primary-accent)" : "var(--secondary-bg)",
            color: activeTab === "apply" ? "white" : "var(--text-primary)",
            fontSize: 14,
          }}
        >
          📝 Apply for Training
        </button>
        <button
          onClick={() => setActiveTab("track")}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "none",
            cursor: "pointer",
            fontWeight: activeTab === "track" ? 600 : 400,
            background: activeTab === "track" ? "var(--primary-accent)" : "var(--secondary-bg)",
            color: activeTab === "track" ? "white" : "var(--text-primary)",
            fontSize: 14,
          }}
        >
          🔍 Track Status
        </button>
      </div>

      {/* Apply Tab */}
      {activeTab === "apply" && (
        <div style={{ background: "var(--secondary-bg)", borderRadius: 12, padding: 24, border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 20px" }}>Student Application Form</h2>

          {submitResult && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
                background: submitResult.success ? "#dcfce7" : "#fee2e2",
                color: submitResult.success ? "#166534" : "#991b1b",
              }}
            >
              {submitResult.message}
              {submitResult.appNo && (
                <div style={{ marginTop: 8, fontWeight: 600 }}>
                  Your Application No: <strong>{submitResult.appNo}</strong>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleApply}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Surname *</label>
                <input
                  style={inputStyle}
                  value={form.student_surname}
                  onChange={(e) => setForm({ ...form, student_surname: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Student Name *</label>
                <input
                  style={inputStyle}
                  value={form.student_name}
                  onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Father's Name *</label>
                <input
                  style={inputStyle}
                  value={form.student_father_name}
                  onChange={(e) => setForm({ ...form, student_father_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={form.student_email}
                  onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                <input
                  style={inputStyle}
                  type="tel"
                  value={form.student_mobile}
                  onChange={(e) => setForm({ ...form, student_mobile: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  style={inputStyle}
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  {masters.categories.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Branch *</label>
                <select
                  style={inputStyle}
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  {masters.branches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">College *</label>
                <select
                  style={inputStyle}
                  value={form.collegeId}
                  onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  {masters.colleges.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.college_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year of Study *</label>
                <select
                  style={inputStyle}
                  value={form.year_of_study}
                  onChange={(e) => setForm({ ...form, year_of_study: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6].map((y) => (
                    <option key={y} value={y}>
                      Year {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <select
                  style={inputStyle}
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  required
                >
                  <option value="">Select</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Requested From *</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.requested_from}
                  onChange={(e) => setForm({ ...form, requested_from: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Requested To *</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.requested_to}
                  onChange={(e) => setForm({ ...form, requested_to: e.target.value })}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ marginTop: 20, width: "100%", padding: "12px", fontSize: 15 }}
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      )}

      {/* Track Tab */}
      {activeTab === "track" && (
        <div>
          <div
            style={{
              background: "var(--secondary-bg)",
              borderRadius: 12,
              padding: 24,
              border: "1px solid var(--border-color)",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px" }}>Track Application Status</h2>
            <form onSubmit={handleTrack} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Application No.</label>
                <input
                  style={inputStyle}
                  value={trackQuery.application_no}
                  onChange={(e) => setTrackQuery({ ...trackQuery, application_no: e.target.value })}
                  placeholder="e.g. VTMS/2026/0001"
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Or Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  value={trackQuery.email}
                  onChange={(e) => setTrackQuery({ ...trackQuery, email: e.target.value })}
                  placeholder="student@example.com"
                />
              </div>
              <button type="submit" disabled={tracking} className="btn btn-primary" style={{ padding: "10px 24px" }}>
                {tracking ? "Searching..." : "Search"}
              </button>
            </form>
          </div>

          {trackError && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "#fee2e2", color: "#991b1b", marginBottom: 12 }}>
              {trackError}
            </div>
          )}

          {trackResult &&
            trackResult.map((app: any) => (
              <div
                key={app.id}
                style={{
                  background: "var(--secondary-bg)",
                  borderRadius: 12,
                  padding: 20,
                  border: "1px solid var(--border-color)",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>
                      {app.student_name} {app.student_surname}
                    </strong>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>App No: {app.application_no}</div>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      background: STATUS_COLORS[app.status] || "#6b7280",
                      color: "white",
                    }}
                  >
                    {STATUS_LABELS[app.status] || app.status}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <div>📅 Applied: {new Date(app.application_date).toLocaleDateString()}</div>
                  <div>🏫 College: {app.college?.college_name}</div>
                  <div>📚 Branch: {app.branch?.branch_name}</div>
                  <div>📋 Category: {app.category?.name}</div>
                  <div>📆 From: {new Date(app.requested_from).toLocaleDateString()}</div>
                  <div>📆 To: {new Date(app.requested_to).toLocaleDateString()}</div>
                  {app.posting_department && <div>🏢 Department: {app.posting_department.department_name}</div>}
                </div>
                {app.permission_letter_ref && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
                    📄 Permission Ref: {app.permission_letter_ref}
                  </div>
                )}
                {app.gate_pass_no && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>🪪 Gate Pass: {app.gate_pass_no}</div>
                )}
                {app.certificate_ref && (
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>📜 Certificate: {app.certificate_ref}</div>
                )}
                {app.no_due_ref && <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>✅ No Due: {app.no_due_ref}</div>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
