import React, { useEffect, useState } from "react";
import api from "../api";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";

interface RoleMapping {
  id: number;
  designation: string;
  role: string;
  description: string | null;
}

const ROLES = ["ADMIN", "RECOMMENDING_EMPLOYEE", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE", "ED_GM_APPROVER"];

const RoleMappingAdmin: React.FC = () => {
  const { addToast } = useToast();
  const [mappings, setMappings] = useState<RoleMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RoleMapping | null>(null);
  const [formDesignation, setFormDesignation] = useState("");
  const [formRole, setFormRole] = useState(ROLES[0]);
  const [formDesc, setFormDesc] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<any>(null);
  const [confirmApply, setConfirmApply] = useState(false);

  const loadMappings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/roles");
      setMappings(res.data.data || []);
    } catch {
      setError("Failed to load role mappings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormDesignation("");
    setFormRole(ROLES[0]);
    setFormDesc("");
    setShowForm(true);
  };

  const openEdit = (m: RoleMapping) => {
    setEditing(m);
    setFormDesignation(m.designation);
    setFormRole(m.role);
    setFormDesc(m.description || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formDesignation.trim()) return addToast("error", "Designation is required");
    try {
      if (editing) {
        await api.put(`/roles/${editing.id}`, { role: formRole, description: formDesc });
        addToast("success", "Role mapping updated");
      } else {
        await api.post("/roles", { designation: formDesignation.trim(), role: formRole, description: formDesc });
        addToast("success", "Role mapping created");
      }
      setShowForm(false);
      await loadMappings();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Failed to save");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/roles/${id}`);
      addToast("success", "Deleted");
      await loadMappings();
    } catch {
      addToast("error", "Failed to delete");
    }
  };

  const handleApply = async () => {
    setConfirmApply(false);
    setApplying(true);
    setApplyResult(null);
    try {
      const res = await api.post("/roles/apply");
      setApplyResult(res.data.data);
      addToast("success", "Apply completed");
    } catch {
      addToast("error", "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Role Mapping Admin</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                Map employee designations to system roles for automatic account creation
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-outline" onClick={() => setConfirmApply(true)} disabled={applying}>
                {applying ? "Applying..." : "🔄 Apply to Employees"}
              </button>
              <button className="btn btn-primary" onClick={openCreate}>
                + Add Mapping
              </button>
            </div>
          </div>

          {applyResult && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #16a34a",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              <strong>Apply Results:</strong> {applyResult.matched} matched, {applyResult.unmatched} unmatched, {applyResult.skipped}{" "}
              skipped, {applyResult.errors} errors
            </div>
          )}

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

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : mappings.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No role mappings configured. Add one to get started.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Designation</th>
                    <th>System Role</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 500 }}>{m.designation}</td>
                      <td>
                        <span className="badge badge-info">{m.role.replace(/_/g, " ")}</span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{m.description || "-"}</td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>
                            Edit
                          </button>
                          <button className="btn btn-outline btn-sm" style={{ color: "#dc2626" }} onClick={() => handleDelete(m.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>Total: {mappings.length} mappings</p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Confirmation Modal */}
      <Modal
        open={confirmApply}
        title="Confirm Apply to Employees"
        onClose={() => setConfirmApply(false)}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setConfirmApply(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleApply}>
              Yes, Apply
            </button>
          </>
        }
      >
        <p>
          This will create user accounts for unmatched employees whose designations have matching role mappings. Default password will
          be <strong>changeme123</strong>. Continue?
        </p>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        open={showForm}
        title={editing ? "Edit Role Mapping" : "New Role Mapping"}
        onClose={() => setShowForm(false)}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <label className="form-label">Designation *</label>
            <input
              className="form-input"
              value={formDesignation}
              onChange={(e) => setFormDesignation(e.target.value)}
              placeholder="e.g. Manager, HR"
              disabled={!!editing}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="form-label">System Role *</label>
            <select className="form-input" value={formRole} onChange={(e) => setFormRole(e.target.value)} style={{ width: "100%" }}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Optional description..."
              style={{ width: "100%", resize: "vertical" }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleMappingAdmin;
