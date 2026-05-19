import React, { useEffect, useState } from "react";
import api from "../api";

interface ApplicationItem {
  id: number;
  application_no: string;
  student_name: string;
  student_surname: string;
  student_email: string;
  student_mobile: string;
  college?: { college_name: string };
  branch?: { branch_name: string };
  permission_letter_ref: string | null;
  permission_letter_date: string | null;
  status: string;
}

const PermissionLetter: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [generating, setGenerating] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications", { params: { perPage: 200 } });
      const all: ApplicationItem[] = res.data.data || [];
      // Show apps that are ready for permission letter or already have one
      setApplications(
        all.filter((a) => ["SCRUTINIZED", "ASSIGNED_TO_INCHARGE", "PERMISSION_LETTER_SENT", "JOINING_PENDING"].includes(a.status)),
      );
    } catch {
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (id: number) => {
    setGenerating(id);
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`/permission-letters/${id}/generate`);
      const data = res.data.data;
      if (data?.pdfUrl) {
        window.open(data.pdfUrl, "_blank");
      }
      setSuccess(
        `Permission letter generated${data?.updated?.permission_letter_ref ? `: ${data.updated.permission_letter_ref}` : ""}`,
      );
      await loadApplications();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to generate permission letter";
      setError(msg);
    } finally {
      setGenerating(null);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedIds.length === 0) return;
    setBulkGenerating(true);
    setError("");
    setSuccess("");
    let count = 0;
    for (const id of selectedIds) {
      try {
        await api.post(`/permission-letters/${id}/generate`);
        count++;
      } catch {
        // continue with others
      }
    }
    setSuccess(`Generated ${count} of ${selectedIds.length} permission letters`);
    setSelectedIds([]);
    setBulkGenerating(false);
    await loadApplications();
  };

  const toggle = (id: number) => setSelectedIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const selectAll = () => {
    setSelectedIds(selectedIds.length === filteredApps.length ? [] : filteredApps.map((a) => a.id));
  };

  const filteredApps = applications.filter(
    (a) =>
      !search ||
      a.application_no.toLowerCase().includes(search.toLowerCase()) ||
      a.student_name.toLowerCase().includes(search.toLowerCase()) ||
      a.student_email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="page-gap">
        <div className="panel">
          <div className="panel-body">
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Permission Letter Management</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
              Generate and manage permission letters for scrutinized applications.
            </p>
          </div>

          <div className="search-bar" style={{ marginBottom: "16px" }}>
            <input
              type="text"
              className="form-input"
              style={{ minWidth: "280px" }}
              placeholder="Search by app no, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button className="btn btn-outline btn-sm" onClick={loadApplications} disabled={loading}>
              Refresh
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
              ❌ {error}
            </div>
          )}
          {success && (
            <div
              style={{
                padding: "12px 16px",
                background: "#dcfce7",
                borderRadius: "8px",
                color: "#166534",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              ✅ {success}
            </div>
          )}

          {filteredApps.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No applications ready for permission letters.</p>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div
                  style={{
                    padding: "10px 12px",
                    marginBottom: "12px",
                    background: "var(--primary-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{selectedIds.length} selected</span>
                  <button className="btn btn-primary btn-sm" onClick={handleBulkGenerate} disabled={bulkGenerating}>
                    {bulkGenerating ? "Generating..." : `Generate Letters (${selectedIds.length})`}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedIds([])}>
                    Clear
                  </button>
                </div>
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "32px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === filteredApps.length && filteredApps.length > 0}
                          onChange={selectAll}
                        />
                      </th>
                      <th>App No</th>
                      <th>Student</th>
                      <th>Branch</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Letter Ref</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <input type="checkbox" checked={selectedIds.includes(app.id)} onChange={() => toggle(app.id)} />
                        </td>
                        <td style={{ fontWeight: 500, fontSize: "13px" }}>{app.application_no}</td>
                        <td>
                          {app.student_name} {app.student_surname}
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.branch?.branch_name || "-"}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.student_email}</td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: "11px" }}>
                            {app.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.permission_letter_ref || "-"}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleGenerate(app.id)}
                            disabled={generating === app.id}
                          >
                            {generating === app.id ? (
                              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span className="spinner" /> Generating...
                              </span>
                            ) : app.permission_letter_ref ? (
                              "Regenerate"
                            ) : (
                              "Generate Letter"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>
                  Total: {filteredApps.length} application{filteredApps.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
      `}</style>
    </div>
  );
};

export default PermissionLetter;
