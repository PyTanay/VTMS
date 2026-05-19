import React, { useEffect, useState } from "react";
import api from "../api";
import EmployeeSearch from "../components/EmployeeSearch";

interface PostingLetter {
  id: number;
  ref_no: string;
  qualification_branch: string;
  posting_department: string;
  to_report_to: string;
  selected_weekdays: string;
  training_in_charge: string;
  department_head: string;
  created_at?: string;
  students: Array<{ id: number; applicationId: number; application?: { application_no: string; student_name: string } }>;
}
interface ApplicationItem {
  id: number;
  application_no: string;
  student_name: string;
  branch?: { branch_name: string };
  college?: { college_name: string };
  status: string;
}

const PostingPlanner: React.FC = () => {
  const [letters, setLetters] = useState<PostingLetter[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: number; name: string; designation: string; email: string }>>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  // EmployeeSearch selections
  const [reportingOfficer, setReportingOfficer] = useState<any>(null);
  const [trainingInChargeEmp, setTrainingInChargeEmp] = useState<any>(null);
  const [departmentHeadEmp, setDepartmentHeadEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState<number | null>(null);
  const [qualificationBranch, setQualificationBranch] = useState("");
  const [collegeShortName, setCollegeShortName] = useState("");
  const [collegePlace, setCollegePlace] = useState("");
  const [postingDepartment, setPostingDepartment] = useState("");
  const [toReportTo, setToReportTo] = useState("");
  const [reportingOfficerEmail, setReportingOfficerEmail] = useState("");
  const [trainingInCharge, setTrainingInCharge] = useState("");
  const [departmentHead, setDepartmentHead] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadLetters(), loadApplications(), loadMeta()]);
    } catch (err: any) {
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadLetters = async () => {
    const res = await api.get("/postings");
    setLetters(res.data.data || []);
  };

  const loadApplications = async () => {
    const res = await api.get("/applications?perPage=500");
    const all: ApplicationItem[] = res.data.data || [];
    setApplications(
      all.filter((a) =>
        ["JOINING_PENDING", "DOCUMENTS_VERIFIED", "GATE_PASS_CREATED", "BIODATA_COMPLETED", "POSTED", "TRAINING_ACTIVE"].includes(
          a.status,
        ),
      ),
    );
  };

  const loadMeta = async () => {
    try {
      const depRes = await api.get("/employees/meta/departments");
      setDepartments(depRes.data?.data || []);
    } catch {
      try {
        const depMast = await api.get("/masters/departments");
        setDepartments((depMast.data.data || []).map((d: any) => d.department_name));
      } catch {
        setDepartments([]);
      }
    }
    try {
      const empRes = await api.get("/employees?active=true");
      setEmployees(empRes.data?.data || []);
    } catch {
      setEmployees([]);
    }
  };

  const toggle = (id: number) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const selectAll = () => {
    setSelectedIds(selectedIds.length === applications.length ? [] : applications.map((a) => a.id));
  };

  const handleCreate = async () => {
    if (!qualificationBranch || !postingDepartment || selectedIds.length === 0) {
      return setError("Branch, department, and students are required");
    }
    try {
      setError("");
      await api.post("/postings", {
        qualification_branch: qualificationBranch,
        college_short_name: collegeShortName || selectedCollege,
        college_place: collegePlace,
        posting_department: postingDepartment,
        to_report_to: reportingOfficer ? `${reportingOfficer.name} (${reportingOfficer.designation})` : toReportTo,
        reporting_officer_email: reportingOfficer?.email || reportingOfficerEmail,
        selected_weekdays: "Monday,Tuesday,Wednesday,Thursday,Friday",
        training_in_charge: trainingInChargeEmp
          ? `${trainingInChargeEmp.name} (${trainingInChargeEmp.designation})`
          : trainingInCharge,
        department_head: departmentHeadEmp ? `${departmentHeadEmp.name} (${departmentHeadEmp.designation})` : departmentHead,
        applicationIds: selectedIds,
      });
      setSelectedIds([]);
      resetForm();
      await loadLetters();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create posting letter");
    }
  };

  const resetForm = () => {
    setQualificationBranch("");
    setCollegeShortName("");
    setCollegePlace("");
    setSelectedCollege("");
    setPostingDepartment("");
    setToReportTo("");
    setReportingOfficerEmail("");
    setTrainingInCharge("");
    setDepartmentHead("");
    setReportingOfficer(null);
    setTrainingInChargeEmp(null);
    setDepartmentHeadEmp(null);
  };

  const handleGeneratePdf = async (id: number) => {
    setGenerating(id);
    try {
      const res = await api.post(`/postings/${id}/generate`);
      if (res.data.data?.pdfUrl) window.open(res.data.data.pdfUrl, "_blank");
    } catch {
      setError("Failed to generate PDF");
    } finally {
      setGenerating(null);
    }
  };

  const availableColleges = [...new Set(applications.map((a) => a.college?.college_name).filter(Boolean))] as string[];
  const availableBranches = [...new Set(applications.map((a) => a.branch?.branch_name).filter(Boolean))] as string[];

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Posting Planner</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", marginBottom: "16px", fontSize: "14px" }}>
            Create posting letters for trainees and manage issued letters.
          </p>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                borderRadius: "8px",
                color: "#991b1b",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Qualification Branch *</label>
              <input
                className="form-input"
                list="branch-list"
                value={qualificationBranch}
                onChange={(e) => setQualificationBranch(e.target.value)}
                placeholder="Type or select"
              />
              <datalist id="branch-list">
                {availableBranches.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">College</label>
              <select
                className="form-input"
                value={selectedCollege}
                onChange={(e) => {
                  setSelectedCollege(e.target.value);
                  setCollegeShortName(e.target.value);
                }}
              >
                <option value="">-- Select college --</option>
                {availableColleges.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">College Place</label>
              <input className="form-input" value={collegePlace} onChange={(e) => setCollegePlace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Posting Department *</label>
              <select className="form-input" value={postingDepartment} onChange={(e) => setPostingDepartment(e.target.value)}>
                <option value="">-- Select department --</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <EmployeeSearch
                label="Reporting Officer"
                onSelect={(emp) => {
                  setReportingOfficer(emp);
                  setToReportTo(emp ? `${emp.name} (${emp.designation})` : "");
                  setReportingOfficerEmail(emp?.email || "");
                }}
                selectedEmployee={reportingOfficer}
                placeholder="Search by name, EC No, or initials..."
                filterDepartment={postingDepartment || undefined}
              />
            </div>
            <div className="form-group">
              <EmployeeSearch
                label="Training In-Charge (Training Center Employee)"
                onSelect={(emp) => setTrainingInChargeEmp(emp)}
                selectedEmployee={trainingInChargeEmp}
                placeholder="Search traiing center employee..."
              />
            </div>
            <div className="form-group">
              <EmployeeSearch
                label="Department Head (CM/AGM/GM/ED only)"
                onSelect={(emp) => setDepartmentHeadEmp(emp)}
                selectedEmployee={departmentHeadEmp}
                placeholder="Search for dept head..."
                filterDepartment={postingDepartment || undefined}
                filterDesignation="Chief Manager|AGM|GM|ED|Executive Director|Deputy General Manager|Additional General Manager"
              />
            </div>
          </div>

          <div className="panel" style={{ marginTop: "16px", padding: "16px", background: "var(--primary-bg)" }}>
            <div className="flex-between" style={{ marginBottom: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "15px" }}>Select Trainees</h3>
              <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                {selectedIds.length} of {applications.length} selected
              </span>
            </div>
            {applications.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No trainees available for posting.</p>
            ) : (
              <>
                <div style={{ marginBottom: "8px" }}>
                  <label style={{ fontSize: "13px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.length === applications.length && applications.length > 0}
                      onChange={selectAll}
                    />{" "}
                    Select All / Deselect All
                  </label>
                </div>
                <div
                  className="table-wrap"
                  style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "8px" }}
                >
                  <table style={{ fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "36px" }}></th>
                        <th>App No</th>
                        <th>Name</th>
                        <th>College</th>
                        <th>Branch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggle(app.id)} />
                          </td>
                          <td style={{ fontWeight: 500, fontSize: "12px" }}>{app.application_no}</td>
                          <td>{app.student_name}</td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{app.college?.college_name || "-"}</td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{app.branch?.branch_name || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <button
            className="btn btn-primary"
            style={{ marginTop: "16px" }}
            onClick={handleCreate}
            disabled={!qualificationBranch || !postingDepartment || selectedIds.length === 0}
          >
            Create Posting Letter ({selectedIds.length} students)
          </button>
        </div>
      </div>

      {/* Issued Letters */}
      <div className="panel">
        <div className="panel-body">
          <h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>Issued Posting Letters</h3>
          {loading ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Loading...</p>
          ) : letters.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No letters issued yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ref No</th>
                    <th>Branch</th>
                    <th>Department</th>
                    <th>Trainees</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {letters.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 500 }}>{l.ref_no}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{l.qualification_branch}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{l.posting_department}</td>
                      <td>{l.students?.length || 0}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                        {l.created_at ? new Date(l.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleGeneratePdf(l.id)}
                          disabled={generating === l.id}
                        >
                          {generating === l.id ? "..." : "Download PDF"}
                        </button>
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

export default PostingPlanner;
