import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import EmployeeSearch from "../components/EmployeeSearch";
import { useToast } from "../context/ToastContext";

const BiodataForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState("view");

  // All form fields
  const [localAddress, setLocalAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [caste, setCaste] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [physicallyChallenged, setPhysicallyChallenged] = useState(false);
  const [challengeDetails, setChallengeDetails] = useState("");

  const [academics, setAcademics] = useState<
    Array<{ course_name: string; board_university: string; passing_year: string; percentage_cgpa: string }>
  >([]);
  const [familyMembers, setFamilyMembers] = useState<
    Array<{ member_name: string; relationship: string; age: string; occupation: string; contact_no: string }>
  >([]);
  const [gnfcRelatives, setGnfcRelatives] = useState<
    Array<{ relative_name: string; relationship: string; department: string; employee_no: string }>
  >([]);
  const [savedData, setSavedData] = useState<any>(null);

  useEffect(() => {
    loadBiodata();
  }, [id]);

  const loadBiodata = async () => {
    try {
      const appRes = await api.get(`/applications/${id}`);
      const bio = appRes.data.data?.biodata;
      setSavedData(bio);
      if (bio) {
        setLocalAddress(bio.local_address || "");
        setPermanentAddress(bio.permanent_address || "");
        setCaste(bio.caste || "");
        setHeight(bio.height_cm?.toString() || "");
        setWeight(bio.weight_kg?.toString() || "");
        setBloodGroup(bio.blood_group || "");
        setPhysicallyChallenged(bio.physically_challenged || false);
        setChallengeDetails(bio.challenge_details || "");
        setAcademics(
          (bio.academics || []).map((a: any) => ({
            course_name: a.course_name,
            board_university: a.board_university,
            passing_year: a.passing_year?.toString() || "",
            percentage_cgpa: a.percentage_cgpa?.toString() || "",
          })),
        );
        setFamilyMembers(
          (bio.familyMembers || []).map((f: any) => ({
            member_name: f.member_name,
            relationship: f.relationship,
            age: f.age?.toString() || "",
            occupation: f.occupation || "",
            contact_no: f.contact_no || "",
          })),
        );
        setGnfcRelatives(
          (bio.gnfcRelatives || []).map((g: any) => ({
            relative_name: g.relative_name,
            relationship: g.relationship,
            department: g.department,
            employee_no: g.employee_no,
          })),
        );
      }
    } catch {
      setError("Failed to load biodata");
    }
  };

  // --- Edit helpers ---
  const addAcademic = () =>
    setAcademics([...academics, { course_name: "", board_university: "", passing_year: "", percentage_cgpa: "" }]);
  const updAcademic = (i: number, f: string, v: string) => {
    const c = [...academics];
    (c as any)[i][f] = v;
    setAcademics(c);
  };
  const addFamily = () =>
    setFamilyMembers([...familyMembers, { member_name: "", relationship: "", age: "", occupation: "", contact_no: "" }]);
  const updFamily = (i: number, f: string, v: string) => {
    const c = [...familyMembers];
    (c as any)[i][f] = v;
    setFamilyMembers(c);
  };
  const addRel = () => setGnfcRelatives([...gnfcRelatives, { relative_name: "", relationship: "", department: "", employee_no: "" }]);
  const updRel = (i: number, f: string, v: string) => {
    const c = [...gnfcRelatives];
    (c as any)[i][f] = v;
    setGnfcRelatives(c);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await api.put(`/biodata/${id}`, {
        local_address: localAddress,
        permanent_address: permanentAddress,
        caste,
        height_cm: height ? Number(height) : undefined,
        weight_kg: weight ? Number(weight) : undefined,
        blood_group: bloodGroup,
        physically_challenged: physicallyChallenged,
        challenge_details: challengeDetails,
        student_declaration: true,
        academics: academics.filter((a) => a.course_name && a.board_university),
        familyMembers: familyMembers.filter((f) => f.member_name),
        gnfcRelatives: gnfcRelatives.filter((g) => g.relative_name),
      });
      addToast("success", "Biodata saved!");
      setEditMode(false);
      await loadBiodata();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Compact Card Component ───
  const CompactCard = ({
    title,
    items,
    renderItem,
    onAdd,
    onRemove,
    edit,
  }: {
    title: string;
    items: any[];
    renderItem: (item: any, i: number) => React.ReactNode;
    onAdd: () => void;
    onRemove: (i: number) => void;
    edit: boolean;
  }) => (
    <div className="panel" style={{ marginBottom: "16px" }}>
      <div className="panel-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
            {title}{" "}
            {items.length > 0 && (
              <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "12px" }}>({items.length})</span>
            )}
          </h4>
          {edit && (
            <button className="btn btn-primary btn-sm" onClick={onAdd}>
              + Add
            </button>
          )}
        </div>
        {items.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No entries.</p>}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
              padding: "10px 12px",
              marginBottom: "6px",
              background: "var(--primary-bg)",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: edit ? "1fr 1fr 1.3fr" : "1fr 1fr",
                gap: "8px",
                fontSize: "13px",
              }}
            >
              {edit
                ? renderItem(item, i)
                : Object.entries(item)
                    .filter(([k]) => k !== "id")
                    .map(([k, v]) => (
                      <div key={k}>
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>{k.replace(/_/g, " ")}</span>
                        <div style={{ fontWeight: 500 }}>{String(v || "-")}</div>
                      </div>
                    ))}
            </div>
            {edit && (
              <button
                className="btn btn-outline btn-sm"
                style={{ color: "#dc2626", padding: "2px 6px", fontSize: "11px", flexShrink: 0 }}
                onClick={() => onRemove(i)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ padding: "6px 0", borderBottom: "1px solid var(--border-color)", display: "flex" }}>
      <span style={{ minWidth: "160px", color: "var(--text-secondary)", fontSize: "13px" }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: "13px" }}>{value || "-"}</span>
    </div>
  );

  if (!savedData && !editMode && !error) {
    return (
      <div className="page-gap">
        <div className="panel">
          <div className="panel-body">
            <p style={{ color: "var(--text-secondary)" }}>
              No biodata yet.{" "}
              <button className="btn btn-primary btn-sm" onClick={() => setEditMode(true)}>
                Create Biodata
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Biodata / Joining Form</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                {editMode ? "Editing mode — make changes below" : "View mode — biodata details"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {!editMode && (
                <button className="btn btn-primary" onClick={() => setEditMode(true)}>
                  ✏️ Edit
                </button>
              )}
              <button className="btn btn-outline" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

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

      {/* View Mode - Single Card */}
      {!editMode && savedData && (
        <div className="panel">
          <div className="panel-body">
            <h3 style={{ margin: "0 0 12px", fontSize: "15px" }}>Personal Details</h3>
            <InfoRow label="Local Address" value={savedData.local_address} />
            <InfoRow label="Permanent Address" value={savedData.permanent_address} />
            <InfoRow label="Caste" value={savedData.caste} />
            <InfoRow label="Blood Group" value={savedData.blood_group} />
            <InfoRow label="Height" value={savedData.height_cm ? `${savedData.height_cm} cm` : ""} />
            <InfoRow label="Weight" value={savedData.weight_kg ? `${savedData.weight_kg} kg` : ""} />
            <InfoRow
              label="Physically Challenged"
              value={savedData.physically_challenged ? `Yes - ${savedData.challenge_details || ""}` : "No"}
            />
          </div>
        </div>
      )}

      {/* Compact Cards in View Mode */}
      {!editMode && savedData && (
        <>
          <CompactCard
            title="Academic Record"
            items={academics}
            edit={false}
            onAdd={() => {}}
            onRemove={() => {}}
            renderItem={() => null}
          />
          <CompactCard
            title="Family Background"
            items={familyMembers}
            edit={false}
            onAdd={() => {}}
            onRemove={() => {}}
            renderItem={() => null}
          />
          <CompactCard
            title="GNFC Relatives"
            items={gnfcRelatives}
            edit={false}
            onAdd={() => {}}
            onRemove={() => {}}
            renderItem={() => null}
          />
        </>
      )}

      {/* Edit Mode */}
      {editMode && (
        <div className="panel">
          <div className="panel-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Local Address</label>
                <textarea className="form-input" rows={2} value={localAddress} onChange={(e) => setLocalAddress(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Permanent Address</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Caste</label>
                <input className="form-input" value={caste} onChange={(e) => setCaste(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select className="form-input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option value="">Select</option>{" "}
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input type="number" className="form-input" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" className="form-input" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={physicallyChallenged} onChange={(e) => setPhysicallyChallenged(e.target.checked)} />{" "}
                  Physically Challenged
                </label>
              </div>
              {physicallyChallenged && (
                <div className="form-group">
                  <label className="form-label">Details</label>
                  <input className="form-input" value={challengeDetails} onChange={(e) => setChallengeDetails(e.target.value)} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode - Compact Cards */}
      {editMode && (
        <>
          <CompactCard
            title="Academic Details"
            items={academics}
            edit={true}
            onAdd={addAcademic}
            onRemove={(i) => setAcademics(academics.filter((_, idx) => idx !== i))}
            renderItem={(a, i) => (
              <>
                <div>
                  <label className="form-label" style={{ fontSize: "11px" }}>
                    Course
                  </label>
                  <input
                    className="form-input"
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                    value={a.course_name}
                    onChange={(e) => updAcademic(i, "course_name", e.target.value)}
                    placeholder="SSCE"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: "11px" }}>
                    Board
                  </label>
                  <input
                    className="form-input"
                    style={{ fontSize: "12px", padding: "4px 8px" }}
                    value={a.board_university}
                    onChange={(e) => updAcademic(i, "board_university", e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                      Pass Year
                    </label>
                    <input
                      className="form-input"
                      style={{ fontSize: "12px", padding: "4px 8px", width: "100%" }}
                      type="text"
                      inputMode="numeric"
                      value={a.passing_year}
                      onChange={(e) => updAcademic(i, "passing_year", e.target.value)}
                      placeholder="e.g. 2024"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                      % / CGPA
                    </label>
                    <input
                      className="form-input"
                      style={{ fontSize: "12px", padding: "4px 8px", width: "100%" }}
                      type="text"
                      inputMode="decimal"
                      value={a.percentage_cgpa}
                      onChange={(e) => updAcademic(i, "percentage_cgpa", e.target.value)}
                      placeholder="e.g. 85 or 8.5"
                    />
                  </div>
                </div>
              </>
            )}
          />

          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="panel-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                  Family Background{" "}
                  {familyMembers.length > 0 && (
                    <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "12px" }}>({familyMembers.length})</span>
                  )}
                </h4>
                <button className="btn btn-primary btn-sm" onClick={addFamily}>
                  + Add
                </button>
              </div>
              {familyMembers.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No members added.</p>}
              {familyMembers.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "6px",
                    background: "var(--primary-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Name
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                        value={f.member_name}
                        onChange={(e) => updFamily(i, "member_name", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Relationship
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                        value={f.relationship}
                        onChange={(e) => updFamily(i, "relationship", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Age
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px", width: "100%" }}
                        type="number"
                        value={f.age}
                        onChange={(e) => updFamily(i, "age", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Occupation
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px", width: "100%" }}
                        value={f.occupation}
                        onChange={(e) => updFamily(i, "occupation", e.target.value)}
                        placeholder="e.g. Farmer, Govt. Service"
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Contact No
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px", maxWidth: "280px" }}
                        type="text"
                        value={f.contact_no}
                        onChange={(e) => updFamily(i, "contact_no", e.target.value)}
                        placeholder="Mobile / phone number"
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: "#dc2626", padding: "2px 6px", fontSize: "11px" }}
                    onClick={() => setFamilyMembers(familyMembers.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="panel-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>
                  GNFC Relatives{" "}
                  {gnfcRelatives.length > 0 && (
                    <span style={{ color: "var(--text-secondary)", fontWeight: 400, fontSize: "12px" }}>({gnfcRelatives.length})</span>
                  )}
                </h4>
                <button className="btn btn-primary btn-sm" onClick={addRel}>
                  + Add
                </button>
              </div>
              {gnfcRelatives.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No relatives added.</p>}
              {gnfcRelatives.map((g, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "6px",
                    background: "var(--primary-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "6px" }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <EmployeeSearch
                        label="Search by Name, EC No, or Initials"
                        placeholder="Type name or EC number..."
                        onSelect={(emp) => {
                          if (emp) {
                            updRel(i, "relative_name", emp.name);
                            updRel(i, "department", emp.department);
                            updRel(i, "employee_no", emp.employee_no);
                          }
                        }}
                        selectedEmployee={
                          g.employee_no
                            ? {
                                name: g.relative_name,
                                employee_no: g.employee_no,
                                department: g.department,
                                id: 0,
                                designation: "",
                                email: "",
                              }
                            : null
                        }
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Relationship
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                        value={g.relationship}
                        onChange={(e) => updRel(i, "relationship", e.target.value)}
                        placeholder="e.g. Father, Uncle"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Employee No
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                        value={g.employee_no}
                        onChange={(e) => updRel(i, "employee_no", e.target.value)}
                        readOnly
                        placeholder="Auto-filled from search"
                      />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="form-label" style={{ fontSize: "11px" }}>
                        Department
                      </label>
                      <input
                        className="form-input"
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                        value={g.department}
                        onChange={(e) => updRel(i, "department", e.target.value)}
                        placeholder="Auto-filled from search"
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: "#dc2626", padding: "2px 6px", fontSize: "11px" }}
                    onClick={() => setGnfcRelatives(gnfcRelatives.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Biodata"}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                setEditMode(false);
                loadBiodata();
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BiodataForm;
