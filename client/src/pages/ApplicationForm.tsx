import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import FileUpload from "../components/FileUpload";
import { useAuth } from "../context/AuthContext";

interface MasterItem {
  id: number;
  college_name?: string;
  branch_name?: string;
  name?: string;
}

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const {} = useAuth();
  const [applicantType, setApplicantType] = useState("EMPLOYEE_WARD");
  const [studentName, setStudentName] = useState("");
  const [studentSurname, setStudentSurname] = useState("");
  const [studentFatherName, setStudentFatherName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [collegeId, setCollegeId] = useState<number | "">("");
  const [yearOfStudy, setYearOfStudy] = useState(3);
  const [semester, setSemester] = useState(5);
  const [requestedFrom, setRequestedFrom] = useState("");
  const [requestedTo, setRequestedTo] = useState("");
  const [referenceDetails, setReferenceDetails] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string; employee_no: string } | null>(null);
  const [employeeResults, setEmployeeResults] = useState<Array<{ id: number; name: string; employee_no: string; department: string }>>(
    [],
  );
  const [searchingEmployee, setSearchingEmployee] = useState(false);

  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [branches, setBranches] = useState<MasterItem[]>([]);
  const [colleges, setColleges] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [categoriesRes, branchesRes, collegesRes] = await Promise.all([
          api.get("/masters/categories"),
          api.get("/masters/branches"),
          api.get("/masters/colleges"),
        ]);
        setCategories(categoriesRes.data.data || []);
        setBranches(branchesRes.data.data || []);
        setColleges(collegesRes.data.data || []);
      } catch (error) {
        console.error("Failed to load master data", error);
      }
    };
    loadMasters();
  }, []);

  const searchEmployees = async (query: string) => {
    if (!query || query.length < 2) return;
    setSearchingEmployee(true);
    try {
      const res = await api.get("/employees", { params: { search: query, active: true } });
      setEmployeeResults(res.data.data || []);
    } catch {
      setEmployeeResults([]);
    } finally {
      setSearchingEmployee(false);
    }
  };

  const selectEmployee = (emp: { id: number; name: string; employee_no: string }) => {
    setSelectedEmployee(emp);
    setEmployeeSearch(`${emp.name} (${emp.employee_no})`);
    setEmployeeResults([]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setValidationErrors([]);
    setLoading(true);

    try {
      const payload: Record<string, any> = {
        applicant_type: applicantType,
        student_name: studentName,
        student_surname: studentSurname,
        student_father_name: studentFatherName,
        student_email: studentEmail,
        student_mobile: studentMobile,
        categoryId: Number(categoryId),
        branchId: Number(branchId),
        year_of_study: yearOfStudy,
        semester,
        collegeId: Number(collegeId),
        requested_from: requestedFrom,
        requested_to: requestedTo,
        presently_pursuing: true,
        training_compulsory: true,
        part_of_curriculum: true,
        full_time_course: true,
        status: "SUBMITTED",
      };

      if (applicantType === "EMPLOYEE_WARD" && selectedEmployee) {
        payload.recommending_employee_id = selectedEmployee.id;
      }
      if (applicantType === "OTHER_REFERENCE") {
        payload.reference_details = referenceDetails;
      }

      const res = await api.post("/applications", payload);
      const created = res.data.data;

      // Attach uploaded files
      if (created && uploadedFiles.length) {
        await Promise.all(
          uploadedFiles.map((f) =>
            api.post("/document-verification", { applicationId: created.id, file_path: f.url, doc_type: f.filename }),
          ),
        );
      }
      navigate(`/applications/${created.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Unable to create application.";
      const errors = err?.response?.data?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>New Trainee Application</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                Create a new training application. Fill in all required fields to submit.
              </p>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fecaca",
                color: "#991b1b",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              <strong>Please fix the following:</strong>
              <ul style={{ margin: "8px 0 0 16px" }}>
                {validationErrors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {submitError && (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef2f2",
                borderRadius: "8px",
                border: "1px solid #fecaca",
                color: "#991b1b",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              {/* Applicant Type */}
              <div className="form-group">
                <label className="form-label">Applicant Type *</label>
                <select
                  className="form-input"
                  value={applicantType}
                  onChange={(e) => {
                    setApplicantType(e.target.value);
                    setSelectedEmployee(null);
                    setEmployeeSearch("");
                  }}
                >
                  <option value="EMPLOYEE_WARD">Employee Ward</option>
                  <option value="OTHER_REFERENCE">Other Reference</option>
                </select>
              </div>

              {/* Employee Search */}
              {applicantType === "EMPLOYEE_WARD" && (
                <div className="form-group">
                  <label className="form-label">Recommending Employee *</label>
                  <input
                    className="form-input"
                    value={employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      searchEmployees(e.target.value);
                      setSelectedEmployee(null);
                    }}
                    placeholder="Search by name or employee code..."
                  />
                  {searchingEmployee && <span className="form-hint">Searching...</span>}
                  {employeeResults.length > 0 && (
                    <div
                      style={{
                        marginTop: "4px",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        maxHeight: "150px",
                        overflow: "auto",
                        background: "var(--secondary-bg)",
                      }}
                    >
                      {employeeResults.map((emp) => (
                        <div
                          key={emp.id}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: "1px solid var(--border-color)",
                            fontSize: "13px",
                          }}
                          onClick={() => selectEmployee(emp)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nav-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <strong>{emp.name}</strong> ({emp.employee_no}) — {emp.department}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedEmployee && (
                    <div style={{ marginTop: "4px", color: "var(--primary-accent)", fontSize: "13px", fontWeight: 500 }}>
                      ✅ Selected: {selectedEmployee.name}
                    </div>
                  )}
                </div>
              )}

              {/* Other Reference Details */}
              {applicantType === "OTHER_REFERENCE" && (
                <div className="form-group">
                  <label className="form-label">Reference Details *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={referenceDetails}
                    onChange={(e) => setReferenceDetails(e.target.value)}
                    placeholder="Enter details (e.g., Retired Employee, VVIP Reference, etc.)"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Student Name *</label>
                <input
                  className="form-input"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  required
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Student Surname *</label>
                <input
                  className="form-input"
                  value={studentSurname}
                  onChange={(e) => setStudentSurname(e.target.value)}
                  required
                  placeholder="Last name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Father's Name *</label>
                <input
                  className="form-input"
                  value={studentFatherName}
                  onChange={(e) => setStudentFatherName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile *</label>
                <input
                  className="form-input"
                  type="tel"
                  value={studentMobile}
                  onChange={(e) => setStudentMobile(e.target.value)}
                  required
                  placeholder="10-digit number"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required>
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Branch *</label>
                <select className="form-input" value={branchId} onChange={(e) => setBranchId(Number(e.target.value))} required>
                  <option value="">-- Select Branch --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.branch_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">College *</label>
                <select className="form-input" value={collegeId} onChange={(e) => setCollegeId(Number(e.target.value))} required>
                  <option value="">-- Select College --</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.college_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year of Study *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={4}
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Semester *</label>
                <input
                  type="number"
                  className="form-input"
                  min={1}
                  max={8}
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Requested From *</label>
                <input
                  type="date"
                  className="form-input"
                  value={requestedFrom}
                  onChange={(e) => setRequestedFrom(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Requested To *</label>
                <input
                  type="date"
                  className="form-input"
                  value={requestedTo}
                  onChange={(e) => setRequestedTo(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Documents Upload */}
            <div style={{ marginTop: "20px" }}>
              <label className="form-label">Upload supporting documents (optional)</label>
              <FileUpload
                onUploaded={(item) => {
                  if (item) setUploadedFiles((s) => [...s, item]);
                }}
              />
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  {uploadedFiles.length} file(s) attached
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "12px 24px" }}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate("/applications")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
