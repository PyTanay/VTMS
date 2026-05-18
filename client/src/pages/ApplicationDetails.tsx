import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
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
  college?: { college_name: string } | null;
  category?: { name: string } | null;
  branch?: { branch_name: string } | null;
  approved_from?: string | null;
  approved_to?: string | null;
  scrutiny_date?: string | null;
  scrutiny_remarks?: string | null;
  permission_letter_ref?: string | null;
  permission_letter_date?: string | null;
  posting_department?: { name: string } | null;
  joining_date?: string | null;
  gate_pass_no?: string | null;
  gate_pass_valid_up_to?: string | null;
}

interface DepartmentItem {
  id: number;
  name: string;
}

const statusOptions = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "RECEIVED_BY_TC",
  "SCRUTINIZED",
  "ASSIGNED_TO_INCHARGE",
  "PERMISSION_LETTER_SENT",
  "JOINING_PENDING",
  "DOCUMENTS_VERIFIED",
  "BIODATA_COMPLETED",
  "GATE_PASS_CREATED",
  "POSTED",
  "TRAINING_ACTIVE",
  "NO_DUES_PENDING",
  "REPORT_SUBMITTED",
  "CERTIFICATE_READY",
  "CERTIFICATE_ISSUED",
  "TRAINING_COMPLETED",
  "CLOSED",
];

const ApplicationDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
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
  const canUpdateStatus = isAdmin || isApprover || isSectionHead || isInCharge;
  const canScrutinize = isAdmin || isSectionHead;
  const canCreatePermissionLetter = isAdmin || isInCharge;
  const canSaveJoinDetails = isAdmin || isSectionHead;

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [appRes, depsRes] = await Promise.all([api.get(`/applications/${id}`), api.get("/masters/departments")]);

        setApplication(appRes.data.data);
        setStatus(appRes.data.data.status || "");
        setDepartments(depsRes.data.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [id]);

  useEffect(() => {
    if (application?.approved_from) setApprovedFrom(application.approved_from.slice(0, 10));
    if (application?.approved_to) setApprovedTo(application.approved_to.slice(0, 10));
    if (application?.scrutiny_date) setScrutinyDate(application.scrutiny_date.slice(0, 10));
    if (application?.permission_letter_date) setPermissionLetterDate(application.permission_letter_date.slice(0, 10));
    if (application?.joining_date) setJoiningDate(application.joining_date.slice(0, 10));
    if (application?.gate_pass_valid_up_to) setGatePassValidUpTo(application.gate_pass_valid_up_to.slice(0, 10));
  }, [application]);

  const refresh = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/applications/${id}`);
      setApplication(response.data.data);
      setStatus(response.data.data.status || "");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to refresh application");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSave = async () => {
    if (!status) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/applications/${id}/status`, { status });
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to update status.");
    } finally {
      setSaving(false);
    }
  };

  const handleScrutinize = async () => {
    setSaving(true);
    setError("");
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
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to save scrutiny details.");
    } finally {
      setSaving(false);
    }
  };

  const handlePermissionLetter = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/applications/${id}/permission-letter`, {
        permission_letter_ref: permissionLetterRef || undefined,
        permission_letter_date: permissionLetterDate || undefined,
        posting_department_id: postingDepartmentId ? Number(postingDepartmentId) : undefined,
        status: "PERMISSION_LETTER_SENT",
      });
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to save permission letter details.");
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/applications/${id}/join`, {
        joining_date: joiningDate || undefined,
        gate_pass_no: gatePassNo || undefined,
        gate_pass_valid_up_to: gatePassValidUpTo || undefined,
        status: "JOINING_PENDING",
      });
      await refresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to save joining details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "24px" }}>
        Loading application details…
      </div>
    );
  }

  if (!application) {
    return (
      <div className="glass-panel" style={{ padding: "24px" }}>
        <p>{error || "Application not found."}</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2>Application Details</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>
            Manage status, scrutiny, permission letter, and joining details.
          </p>
        </div>
        <button className="premium-btn" onClick={() => navigate(-1)} style={{ padding: "12px 16px" }}>
          Back to list
        </button>
      </div>

      {error && <div style={{ marginBottom: "20px", color: "#f87171" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3>General Information</h3>
          <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
            <div>
              <strong>Application No:</strong> {application.application_no}
            </div>
            <div>
              <strong>Status:</strong> {application.status}
            </div>
            <div>
              <strong>Applicant Type:</strong> {application.applicant_type}
            </div>
            <div>
              <strong>Student:</strong> {application.student_name} {application.student_surname}
            </div>
            <div>
              <strong>Father's Name:</strong> {application.student_father_name}
            </div>
            <div>
              <strong>Email:</strong> {application.student_email}
            </div>
            <div>
              <strong>Mobile:</strong> {application.student_mobile}
            </div>
            <div>
              <strong>College:</strong> {application.college?.college_name ?? "-"}
            </div>
            <div>
              <strong>Branch:</strong> {application.branch?.branch_name ?? "-"}
            </div>
            <div>
              <strong>Category:</strong> {application.category?.name ?? "-"}
            </div>
          </div>
        </div>

        {canUpdateStatus && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3>Status Update</h3>
            <div style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                }}
              >
                <option value="">Select status</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button className="premium-btn" onClick={handleStatusSave} disabled={saving || !status} style={{ padding: "12px 16px" }}>
                Save status
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: "32px" }}>
        {canScrutinize && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3>Scrutiny</h3>
            <div style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
              <label>
                In-charge ID
                <input
                  type="text"
                  value={scrutinyInChargeId}
                  onChange={(e) => setScrutinyInChargeId(e.target.value)}
                  placeholder="Training in-charge user id"
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <label>
                  Approved From
                  <input
                    type="date"
                    value={approvedFrom}
                    onChange={(e) => setApprovedFrom(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      color: "white",
                    }}
                  />
                </label>
                <label>
                  Approved To
                  <input
                    type="date"
                    value={approvedTo}
                    onChange={(e) => setApprovedTo(e.target.value)}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      color: "white",
                    }}
                  />
                </label>
              </div>
              <label>
                Scrutiny Date
                <input
                  type="date"
                  value={scrutinyDate}
                  onChange={(e) => setScrutinyDate(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <label>
                Remarks
                <textarea
                  value={scrutinyRemarks}
                  onChange={(e) => setScrutinyRemarks(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <button className="premium-btn" onClick={handleScrutinize} disabled={saving} style={{ padding: "12px 16px" }}>
                Save scrutiny details
              </button>
            </div>
          </div>
        )}

        {canCreatePermissionLetter && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3>Permission Letter</h3>
            <div style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
              <label>
                Permission Letter Ref
                <input
                  type="text"
                  value={permissionLetterRef}
                  onChange={(e) => setPermissionLetterRef(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <label>
                Permission Letter Date
                <input
                  type="date"
                  value={permissionLetterDate}
                  onChange={(e) => setPermissionLetterDate(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <label>
                Posting Department
                <select
                  value={postingDepartmentId}
                  onChange={(e) => setPostingDepartmentId(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
              <button className="premium-btn" onClick={handlePermissionLetter} disabled={saving} style={{ padding: "12px 16px" }}>
                Save permission letter details
              </button>
            </div>
          </div>
        )}

        {canSaveJoinDetails && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3>Join / Gate Pass</h3>
            <div style={{ marginTop: "16px", display: "grid", gap: "16px" }}>
              <label>
                Joining Date
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <label>
                Gate Pass No
                <input
                  type="text"
                  value={gatePassNo}
                  onChange={(e) => setGatePassNo(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <label>
                Gate Pass Valid Up To
                <input
                  type="date"
                  value={gatePassValidUpTo}
                  onChange={(e) => setGatePassValidUpTo(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                  }}
                />
              </label>
              <button className="premium-btn" onClick={handleJoin} disabled={saving} style={{ padding: "12px 16px" }}>
                Save join details
              </button>
            </div>
          </div>
        )}

        {!canScrutinize && !canCreatePermissionLetter && !canSaveJoinDetails && !canUpdateStatus && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <h3>Workflow Access</h3>
            <p style={{ color: "var(--text-secondary)", marginTop: "12px" }}>
              Your role does not allow editing workflow sections on this application. You can still view application details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetails;
