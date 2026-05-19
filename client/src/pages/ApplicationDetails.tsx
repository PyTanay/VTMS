import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import FileUpload from "../components/FileUpload";
import AuditTimeline from "../components/AuditTimeline";
import { useAuth } from "../context/AuthContext";

interface ApplicationDetail {
  id: number;
  application_no: string;
  applicant_type: string;
  student_name: string;
  student_surname: string;
  student_father_name: string;
  student_email: string;
  student_mobile: string;
  status: string;
  year_of_study: number;
  semester: number;
  son_daughter: boolean;
  relation: string | null;
  college?: { id: number; college_name: string; place?: string } | null;
  category?: { id: number; name: string } | null;
  branch?: { id: number; branch_name: string } | null;
  recommending_employee?: { id: number; name: string; employee_no: string; department: string } | null;
  reference_details?: string | null;
  approved_from?: string | null;
  approved_to?: string | null;
  scrutiny_date?: string | null;
  scrutiny_remarks?: string | null;
  permission_letter_ref?: string | null;
  permission_letter_date?: string | null;
  posting_department?: { id: number; department_name: string } | null;
  joining_date?: string | null;
  gate_pass_no?: string | null;
  gate_pass_valid_up_to?: string | null;
  verifications?: Array<{
    id: number;
    doc_type: string;
    file_path: string;
    verified: boolean;
    verified_at?: string | null;
    remarks?: string | null;
  }>;
  biodata?: any;
  certificates?: any[];
  noDueForm?: any;
  requested_from?: string;
  requested_to?: string;
  createdAt?: string;
}

interface UserItem {
  id: number;
  username: string;
  role: string;
}

const statusStyles: Record<string, string> = {
  DRAFT: "badge-default",
  SUBMITTED: "badge-info",
  PENDING_APPROVAL: "badge-warning",
  APPROVED: "badge-success",
  REJECTED: "badge-danger",
  RECEIVED_BY_TC: "badge-info",
  SCRUTINIZED: "badge-info",
  PERMISSION_LETTER_SENT: "badge-info",
  JOINING_PENDING: "badge-warning",
  DOCUMENTS_VERIFIED: "badge-success",
  BIODATA_COMPLETED: "badge-success",
  GATE_PASS_CREATED: "badge-success",
  POSTED: "badge-success",
  TRAINING_ACTIVE: "badge-success",
  NO_DUES_PENDING: "badge-warning",
  REPORT_SUBMITTED: "badge-info",
  CERTIFICATE_READY: "badge-warning",
  CERTIFICATE_ISSUED: "badge-success",
  TRAINING_COMPLETED: "badge-success",
  CLOSED: "badge-default",
};

const ApplicationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [departments, setDepartments] = useState<{ id: number; department_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // Form fields
  const [scrutinyInChargeId, setScrutinyInChargeId] = useState("");
  const [approvedFrom, setApprovedFrom] = useState("");
  const [approvedTo, setApprovedTo] = useState("");
  const [scrutinyDate, setScrutinyDate] = useState("");
  const [scrutinyRemarks, setScrutinyRemarks] = useState("");
  const [permissionLetterRef, setPermissionLetterRef] = useState("");
  const [permissionLetterDate, setPermissionLetterDate] = useState("");
  const [postingDepartmentId, setPostingDepartmentId] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [gatePassNo, setGatePassNo] = useState("");
  const [gatePassValidUpTo, setGatePassValidUpTo] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isSectionHead = user?.role === "TRAINING_CENTER_SECTION_HEAD";
  const isInCharge = user?.role === "TRAINING_IN_CHARGE";
  const isApprover = user?.role === "ED_GM_APPROVER";
  const canEdit = isAdmin || isSectionHead || isInCharge || isApprover;

  useEffect(() => {
    const loadData = async () => {
      try {
        const [appRes, usersRes, depsRes] = await Promise.all([
          api.get(`/applications/${id}`),
          api.get("/users"),
          api.get("/masters/departments"),
        ]);
        const app = appRes.data.data;
        setApplication(app);
        setStatus(app.status || "");
        setUsers(usersRes.data.data || []);
        setDepartments(depsRes.data.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (application) {
      setApprovedFrom(application.approved_from?.slice(0, 10) || "");
      setApprovedTo(application.approved_to?.slice(0, 10) || "");
      setScrutinyDate(application.scrutiny_date?.slice(0, 10) || "");
      setScrutinyRemarks(application.scrutiny_remarks || "");
      setPermissionLetterRef(application.permission_letter_ref || "");
      setPermissionLetterDate(application.permission_letter_date?.slice(0, 10) || "");
      setPostingDepartmentId(application.posting_department?.id?.toString() || "");
      setJoiningDate(application.joining_date?.slice(0, 10) || "");
      setGatePassNo(application.gate_pass_no || "");
      setGatePassValidUpTo(application.gate_pass_valid_up_to?.slice(0, 10) || "");
    }
  }, [application]);

  const refresh = async () => {
    try {
      const res = await api.get(`/applications/${id}`);
      setApplication(res.data.data);
      setStatus(res.data.data.status || "");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to refresh");
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    setSuccess("");
    setTimeout(() => setError(""), 5000);
  };
  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleStatusSave = async () => {
    if (!status) return;
    setSaving(true);
    try {
      await api.patch(`/applications/${id}/status`, { status });
      await refresh();
      showSuccess("Status updated successfully");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Unable to update status");
    } finally {
      setSaving(false);
    }
  };

  const handleScrutinize = async () => {
    setSaving(true);
    try {
      await api.patch(`/applications/${id}/scrutinize`, {
        scrutiny_in_charge_id: scrutinyInChargeId || undefined,
        approved_from: approvedFrom || undefined,
        approved_to: approvedTo || undefined,
        scrutiny_date: scrutinyDate || undefined,
        scrutiny_remarks: scrutinyRemarks || undefined,
        status: "SCRUTINIZED",
      });
      await refresh();
      showSuccess("Scrutiny details saved!");
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || "Scrutiny failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionLetter = async () => {
    setSaving(true);
    try {
      await api.patch(`/applications/${id}/permission-letter`, {
        permission_letter_ref: permissionLetterRef || undefined,
        permission_letter_date: permissionLetterDate || undefined,
        posting_department_id: postingDepartmentId ? Number(postingDepartmentId) : undefined,
        status: "PERMISSION_LETTER_SENT",
      });
      await refresh();
      showSuccess("Permission letter details saved!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to save permission letter");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionLetterGenerate = async () => {
    setGeneratingPdf(true);
    try {
      const res = await api.post(`/permission-letters/${id}/generate`);
      const pdfUrl = res.data.data?.pdfUrl;
      if (pdfUrl) window.open(pdfUrl, "_blank");
      await refresh();
      showSuccess("Permission letter PDF generated!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleJoin = async () => {
    setSaving(true);
    try {
      await api.patch(`/applications/${id}/join`, {
        joining_date: joiningDate || undefined,
        gate_pass_no: gatePassNo || undefined,
        gate_pass_valid_up_to: gatePassValidUpTo || undefined,
        status: "JOINING_PENDING",
      });
      await refresh();
      showSuccess("Joining details saved!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to save joining details");
    } finally {
      setSaving(false);
    }
  };

  const handleGatePassGenerate = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/gate-pass/${id}/generate`);
      const pdfUrl = res.data.data?.pdfUrl;
      if (pdfUrl) window.open(pdfUrl, "_blank");
      showSuccess("Gate pass generated!");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to generate gate pass");
    } finally {
      setSaving(false);
    }
  };

  const handleDocVerify = async (docId: number) => {
    try {
      await api.patch(`/document-verification/${docId}/verify`, {});
      await refresh();
      showSuccess("Document verified");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Verification failed");
    }
  };

  const getStatusBadge = (s: string) => `badge ${statusStyles[s] || "badge-default"}`;

  if (loading) {
    return (
      <div className="page-gap">
        <div className="panel">
          <div className="panel-body">
            <p style={{ color: "var(--text-secondary)" }}>Loading application details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-gap">
        <div className="panel">
          <div className="panel-body">
            <p style={{ color: "#dc2626" }}>{error || "Application not found."}</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "info", label: "Details" },
    { key: "status", label: "Status & Workflow" },
    { key: "scrutiny", label: "Scrutiny" },
    { key: "permission", label: "Permission Letter" },
    { key: "documents", label: "Documents" },
    { key: "joining", label: "Joining & Gate Pass" },
    { key: "audit", label: "Audit Trail" },
  ];

  return (
    <div className="page-gap">
      {/* Header */}
      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ flexWrap: "wrap", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "20px" }}>Application #{application.application_no}</h2>
                <span className={getStatusBadge(application.status)} style={{ fontSize: "13px", padding: "4px 12px" }}>
                  {application.status.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                {application.applicant_type === "EMPLOYEE_WARD" ? "Employee Ward" : "Other Reference"} | Created:{" "}
                {new Date(application.createdAt || "").toLocaleDateString()}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(`/applications/${id}/biodata`)}>
                Biodata
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate("/applications")}>
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            borderRadius: "8px",
            color: "#991b1b",
            border: "1px solid #fecaca",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{
            padding: "12px 16px",
            background: "#dcfce7",
            borderRadius: "8px",
            color: "#166534",
            border: "1px solid #bbf7d0",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "4px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`btn ${activeTab === tab.key ? "btn-primary" : "btn-outline"} btn-sm`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {activeTab === "info" && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Application Information</h3>
            <div className="form-grid-2">
              <div>
                <div className="form-label">Student Name</div>
                <div style={{ fontWeight: 500 }}>
                  {application.student_name} {application.student_surname}
                </div>
              </div>
              <div>
                <div className="form-label">Father's Name</div>
                <div>{application.student_father_name}</div>
              </div>
              <div>
                <div className="form-label">Email</div>
                <div>{application.student_email}</div>
              </div>
              <div>
                <div className="form-label">Mobile</div>
                <div>{application.student_mobile}</div>
              </div>
              <div>
                <div className="form-label">Category</div>
                <div>{application.category?.name || "-"}</div>
              </div>
              <div>
                <div className="form-label">Branch</div>
                <div>{application.branch?.branch_name || "-"}</div>
              </div>
              <div>
                <div className="form-label">College</div>
                <div>{application.college?.college_name || "-"}</div>
              </div>
              <div>
                <div className="form-label">Year / Semester</div>
                <div>
                  Year {application.year_of_study}, Semester {application.semester}
                </div>
              </div>
              <div>
                <div className="form-label">Requested Period</div>
                <div>
                  {application.requested_from?.slice(0, 10)} to {application.requested_to?.slice(0, 10)}
                </div>
              </div>
              {application.recommending_employee && (
                <div>
                  <div className="form-label">Recommending Employee</div>
                  <div>
                    {application.recommending_employee.name} ({application.recommending_employee.employee_no})
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Status */}
      {activeTab === "status" && canEdit && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Status Management</h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ minWidth: "280px" }}>
                <label className="form-label">Application Status</label>
                <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {Object.keys(statusStyles).map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleStatusSave} disabled={saving || !status}>
                {saving ? "Saving..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Scrutiny */}
      {activeTab === "scrutiny" && canEdit && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Scrutiny Details</h3>
            <div className="form-grid-2">
              <div>
                <label className="form-label">Training In-Charge</label>
                <select className="form-input" value={scrutinyInChargeId} onChange={(e) => setScrutinyInChargeId(e.target.value)}>
                  <option value="">Select in-charge</option>
                  {users
                    .filter((u) => u.role === "TRAINING_IN_CHARGE" || u.role === "ADMIN")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.role.replace(/_/g, " ")})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="form-label">Scrutiny Date</label>
                <input type="date" className="form-input" value={scrutinyDate} onChange={(e) => setScrutinyDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Approved From</label>
                <input type="date" className="form-input" value={approvedFrom} onChange={(e) => setApprovedFrom(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Approved To</label>
                <input type="date" className="form-input" value={approvedTo} onChange={(e) => setApprovedTo(e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={scrutinyRemarks}
                  onChange={(e) => setScrutinyRemarks(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: "12px" }} onClick={handleScrutinize} disabled={saving}>
              {saving ? "Saving..." : "Save Scrutiny Details"}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Permission Letter */}
      {activeTab === "permission" && canEdit && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Permission Letter</h3>
            <div className="form-grid-2">
              <div>
                <label className="form-label">Permission Letter Ref</label>
                <input
                  className="form-input"
                  value={permissionLetterRef}
                  onChange={(e) => setPermissionLetterRef(e.target.value)}
                  placeholder="Auto-generated on generate"
                />
              </div>
              <div>
                <label className="form-label">Letter Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={permissionLetterDate}
                  onChange={(e) => setPermissionLetterDate(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Posting Department</label>
                <select className="form-input" value={postingDepartmentId} onChange={(e) => setPostingDepartmentId(e.target.value)}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handlePermissionLetter} disabled={saving}>
                {saving ? "Saving..." : "Save Details"}
              </button>
              <button className="btn btn-primary" onClick={handlePermissionLetterGenerate} disabled={generatingPdf}>
                {generatingPdf ? "Generating..." : "Generate PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Documents */}
      {activeTab === "documents" && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Document Verification</h3>
            <div style={{ marginBottom: "16px" }}>
              <FileUpload applicationId={application.id} onUploaded={() => refresh()} />
            </div>
            {!application.verifications || application.verifications.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No documents uploaded yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Status</th>
                      <th>Verified At</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {application.verifications.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 500 }}>
                          <a href={doc.file_path} target="_blank" rel="noreferrer" style={{ color: "var(--primary-accent)" }}>
                            {doc.doc_type || doc.file_path.split("/").pop()}
                          </a>
                        </td>
                        <td>
                          <span className={`badge ${doc.verified ? "badge-success" : "badge-warning"}`}>
                            {doc.verified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                          {doc.verified_at ? new Date(doc.verified_at).toLocaleDateString() : "-"}
                        </td>
                        <td style={{ color: "var(--text-secondary)" }}>{doc.remarks || "-"}</td>
                        <td>
                          {!doc.verified && (isAdmin || isSectionHead) && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleDocVerify(doc.id)}>
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Joining */}
      {activeTab === "joining" && canEdit && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Joining & Gate Pass</h3>
            <div className="form-grid-2">
              <div>
                <label className="form-label">Joining Date</label>
                <input type="date" className="form-input" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Gate Pass No</label>
                <input
                  className="form-input"
                  value={gatePassNo}
                  onChange={(e) => setGatePassNo(e.target.value)}
                  placeholder="e.g., GP-001"
                />
              </div>
              <div>
                <label className="form-label">Gate Pass Valid Up To</label>
                <input
                  type="date"
                  className="form-input"
                  value={gatePassValidUpTo}
                  onChange={(e) => setGatePassValidUpTo(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handleJoin} disabled={saving}>
                {saving ? "Saving..." : "Save Details"}
              </button>
              <button className="btn btn-primary" onClick={handleGatePassGenerate} disabled={saving}>
                Generate Gate Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Audit Trail */}
      {activeTab === "audit" && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 16px", fontSize: "16px" }}>Audit Trail</h3>
            <AuditTimeline entityName="Application" entityId={application.id} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetails;
