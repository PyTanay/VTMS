import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface MasterItem {
  id: number;
  college_name?: string;
  branch_name?: string;
  name?: string;
}

const ApplicationForm: React.FC = () => {
  const [applicationNo, setApplicationNo] = useState(`APP-${Date.now()}`);
  const [applicantType, setApplicantType] = useState("EMPLOYEE_WARD");
  const [studentName, setStudentName] = useState("");
  const [studentSurname, setStudentSurname] = useState("");
  const [studentFatherName, setStudentFatherName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [collegeId, setCollegeId] = useState<number | "">("");
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [semester, setSemester] = useState(1);
  const [requestedFrom, setRequestedFrom] = useState("");
  const [requestedTo, setRequestedTo] = useState("");
  const [referenceDetails, setReferenceDetails] = useState("");
  const [categories, setCategories] = useState<MasterItem[]>([]);
  const [branches, setBranches] = useState<MasterItem[]>([]);
  const [colleges, setColleges] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");
    setLoading(true);

    try {
      const payload = {
        application_no: applicationNo,
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
        reference_details: applicantType === "OTHER_REFERENCE" ? referenceDetails : undefined,
        status: "SUBMITTED",
      };

      await api.post("/applications", payload);
      navigate("/applications");
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || "Unable to create application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "24px" }}>
      <h2>Create Application</h2>
      <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Create a new trainee application with the required details.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px", marginTop: "24px" }}>
        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr 1fr" }}>
          <label>
            Application No
            <input
              type="text"
              value={applicationNo}
              readOnly
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
            Applicant Type
            <select
              value={applicantType}
              onChange={(e) => setApplicantType(e.target.value)}
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
              <option value="EMPLOYEE_WARD">Employee Ward</option>
              <option value="OTHER_REFERENCE">Other Reference</option>
            </select>
          </label>
          <label>
            Student Name
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
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
            Student Surname
            <input
              type="text"
              value={studentSurname}
              onChange={(e) => setStudentSurname(e.target.value)}
              required
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
            Father's Name
            <input
              type="text"
              value={studentFatherName}
              onChange={(e) => setStudentFatherName(e.target.value)}
              required
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
            Student Email
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              required
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
            Student Mobile
            <input
              type="tel"
              value={studentMobile}
              onChange={(e) => setStudentMobile(e.target.value)}
              required
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
            Category
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
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
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Branch
            <select
              value={branchId}
              onChange={(e) => setBranchId(Number(e.target.value))}
              required
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
              <option value="">Select branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            College
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(Number(e.target.value))}
              required
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
              <option value="">Select college</option>
              {colleges.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.college_name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Year of Study
            <input
              type="number"
              min={1}
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(Number(e.target.value))}
              required
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
            Semester
            <input
              type="number"
              min={1}
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              required
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
            Requested From
            <input
              type="date"
              value={requestedFrom}
              onChange={(e) => setRequestedFrom(e.target.value)}
              required
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
            Requested To
            <input
              type="date"
              value={requestedTo}
              onChange={(e) => setRequestedTo(e.target.value)}
              required
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

        {applicantType === "OTHER_REFERENCE" && (
          <label>
            Reference Details
            <textarea
              value={referenceDetails}
              onChange={(e) => setReferenceDetails(e.target.value)}
              rows={4}
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
        )}

        {submitError && <p style={{ color: "#f87171" }}>{submitError}</p>}

        <button type="submit" className="premium-btn" disabled={loading} style={{ width: "160px", padding: "12px 16px" }}>
          {loading ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default ApplicationForm;
