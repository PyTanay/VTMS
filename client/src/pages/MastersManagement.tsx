import React, { useEffect, useState, useCallback } from "react";
import api from "../api";

interface MasterEntity {
  id: number;
  [key: string]: any;
}

interface EntityConfig {
  key: string;
  label: string;
  nameField: string;
  parentField?: string;
  parentLabel?: string;
  extraFields?: { key: string; label: string; type: string }[];
}

const ENTITIES: EntityConfig[] = [
  { key: "categories", label: "Categories", nameField: "name" },
  { key: "branches", label: "Branches", nameField: "branch_name" },
  { key: "colleges", label: "Colleges", nameField: "college_name", extraFields: [{ key: "place", label: "Place", type: "text" }] },
  { key: "states", label: "States", nameField: "name" },
  { key: "districts", label: "Districts", nameField: "name", parentField: "stateId", parentLabel: "State" },
  { key: "talukas", label: "Talukas", nameField: "name", parentField: "districtId", parentLabel: "District" },
  { key: "cities", label: "Cities", nameField: "name", parentField: "talukaId", parentLabel: "Taluka" },
  { key: "departments", label: "Departments", nameField: "department_name" },
];

const getParentEntityKey = (config: EntityConfig): string => {
  if (!config.parentField) return "";
  return config.parentField.replace("Id", "") + "s";
};

const nameFieldForEntity = (entityKey: string): string => {
  const found = ENTITIES.find((e) => e.key === entityKey);
  return found?.nameField || "name";
};

const MastersManagement: React.FC = () => {
  const [activeEntity, setActiveEntity] = useState(ENTITIES[0].key);
  const [items, setItems] = useState<MasterEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterEntity | null>(null);
  const [formName, setFormName] = useState("");
  const [formExtra, setFormExtra] = useState<Record<string, any>>({});
  const [parentOptions, setParentOptions] = useState<MasterEntity[]>([]);
  const [formParentId, setFormParentId] = useState<number | "">("");

  const config = ENTITIES.find((e) => e.key === activeEntity)!;

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      const res = await api.get(`/masters/${activeEntity}`, { params });
      setItems(res.data.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [activeEntity, searchTerm]);

  const loadParents = useCallback(async () => {
    if (!config.parentField) return;
    try {
      const parentKey = getParentEntityKey(config);
      const res = await api.get(`/masters/${parentKey}`);
      setParentOptions(res.data.data || []);
    } catch {
      setParentOptions([]);
    }
  }, [config]);

  useEffect(() => {
    loadItems();
    loadParents();
    setShowForm(false);
    setEditingItem(null);
    setFormName("");
    setFormExtra({});
    setFormParentId("");
  }, [activeEntity, loadItems, loadParents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadItems();
  };

  const openCreateForm = () => {
    setEditingItem(null);
    setFormName("");
    setFormExtra({});
    setFormParentId("");
    setShowForm(true);
  };

  const openEditForm = (item: MasterEntity) => {
    setEditingItem(item);
    setFormName(item[config.nameField] || "");
    const extra: Record<string, any> = {};
    config.extraFields?.forEach((ef) => {
      extra[ef.key] = item[ef.key] || "";
    });
    setFormExtra(extra);
    setFormParentId(config.parentField ? item[config.parentField] || "" : "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return alert(`${config.nameField} is required`);
    setLoading(true);
    setError("");
    try {
      const payload: Record<string, any> = { name: formName.trim() };
      if (config.parentField && formParentId) payload[config.parentField] = Number(formParentId);
      config.extraFields?.forEach((ef) => {
        if (formExtra[ef.key]) payload[ef.key] = formExtra[ef.key];
      });

      if (editingItem) {
        await api.put(`/masters/${activeEntity}/${editingItem.id}`, payload);
      } else {
        await api.post(`/masters/${activeEntity}`, payload);
      }
      setShowForm(false);
      setEditingItem(null);
      setFormName("");
      setFormExtra({});
      setFormParentId("");
      await loadItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/masters/${activeEntity}/${id}`);
      await loadItems();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to delete");
    }
  };

  const getParentName = (item: MasterEntity): string => {
    if (!config.parentField) return "-";
    const parentKey = config.parentField.replace("Id", "");
    if (item[parentKey]?.name) return item[parentKey].name;
    if (item[config.parentField]) return `ID: ${item[config.parentField]}`;
    return "-";
  };

  const getParentDisplayName = (p: MasterEntity): string => {
    if (!config.parentField) return String(p.id);
    const parentKey = getParentEntityKey(config);
    const nf = nameFieldForEntity(parentKey);
    return p.name || p[nf] || `#${p.id}`;
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Master Data Management</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
                Manage all master entities used across the system
              </p>
            </div>
          </div>

          {/* Entity Tabs */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "20px" }}>
            {ENTITIES.map((entity) => (
              <button
                key={entity.key}
                className={`btn ${activeEntity === entity.key ? "btn-primary" : "btn-outline"} btn-sm`}
                onClick={() => setActiveEntity(entity.key)}
              >
                {entity.label}
              </button>
            ))}
          </div>

          {/* Search & Actions */}
          <div className="flex-between" style={{ marginBottom: "16px" }}>
            <form onSubmit={handleSearch} className="flex-wrap">
              <input
                type="text"
                className="form-input"
                style={{ minWidth: "250px" }}
                placeholder={`Search ${config.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" type="submit">
                Search
              </button>
            </form>
            <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
              + Add {config.label.slice(0, -1)}
            </button>
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

          {/* Create/Edit Form */}
          {showForm && (
            <div className="panel" style={{ padding: "20px", marginBottom: "20px", border: "2px solid var(--primary-accent)" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "15px" }}>
                {editingItem ? `Edit ${config.label.slice(0, -1)}` : `New ${config.label.slice(0, -1)}`}
              </h3>
              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label className="form-label">{config.nameField.replace(/_/g, " ")} *</label>
                  <input
                    className="form-input"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
                {config.extraFields?.map((ef) => (
                  <div key={ef.key}>
                    <label className="form-label">{ef.label}</label>
                    <input
                      className="form-input"
                      value={formExtra[ef.key] || ""}
                      onChange={(e) => setFormExtra((prev) => ({ ...prev, [ef.key]: e.target.value }))}
                      placeholder={`Enter ${ef.label}`}
                    />
                  </div>
                ))}
                {config.parentField && (
                  <div>
                    <label className="form-label">{config.parentLabel}</label>
                    <select
                      className="form-input"
                      value={formParentId}
                      onChange={(e) => setFormParentId(e.target.value ? Number(e.target.value) : "")}
                    >
                      <option value="">Select {config.parentLabel}</option>
                      {parentOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {getParentDisplayName(p)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Data Table */}
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : items.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No {config.label.toLowerCase()} found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{config.nameField.replace(/_/g, " ")}</th>
                    {config.parentField && <th>{config.parentLabel}</th>}
                    {config.extraFields?.map((ef) => (
                      <th key={ef.key}>{ef.label}</th>
                    ))}
                    <th style={{ width: "160px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ color: "var(--text-secondary)" }}>{item.id}</td>
                      <td style={{ fontWeight: 500 }}>{item[config.nameField]}</td>
                      {config.parentField && <td style={{ color: "var(--text-secondary)" }}>{getParentName(item)}</td>}
                      {config.extraFields?.map((ef) => (
                        <td key={ef.key} style={{ color: "var(--text-secondary)" }}>
                          {item[ef.key] || "-"}
                        </td>
                      ))}
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openEditForm(item)}>
                            Edit
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: "#dc2626" }}
                            onClick={() => handleDelete(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>
                Total: {items.length} {config.label.toLowerCase()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MastersManagement;
