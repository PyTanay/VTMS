import React, { useEffect, useState } from "react";
import api from "../api";

interface Line {
  id: number;
  item_name: string;
  cleared: boolean;
  cleared_at: string | null;
  remarks: string | null;
}
interface Form {
  id: number;
  applicationId: number;
  no_due_ref: string;
  status: string;
  lines: Line[];
}
interface AppItem {
  id: number;
  application_no: string;
  student_name: string;
  student_surname: string;
  status: string;
}

const NoDueClearance: React.FC = () => {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearingId, setClearingId] = useState<number | null>(null);

  useEffect(() => {
    const loadApps = async () => {
      try {
        const res = await api.get("/applications", { params: { perPage: 500 } });
        const all: AppItem[] = res.data.data || [];
        setApps(
          all.filter((a) =>
            ["CERTIFICATE_READY", "CERTIFICATE_ISSUED", "NO_DUES_PENDING", "TRAINING_COMPLETED", "REPORT_SUBMITTED"].includes(
              a.status,
            ),
          ),
        );
      } catch {}
      setAppsLoading(false);
    };
    loadApps();
  }, []);

  const loadForm = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/no-dues/application/${applicationId}`);
      setForm(res.data.data);
    } catch {
      setError("Failed to load form.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearLine = async (lineId: number) => {
    const remarks = prompt("Enter remarks:");
    if (remarks === null) return;
    setClearingId(lineId);
    try {
      const res = await api.patch(`/no-dues/line/${lineId}/clear`, { remarks });
      setForm((prev) => (prev ? { ...prev, lines: prev.lines.map((l) => (l.id === lineId ? res.data.data : l)) } : prev));
    } catch {
      alert("Failed");
    } finally {
      setClearingId(null);
    }
  };

  const handleFinalize = async () => {
    if (!form || !window.confirm("Finalize this no-due clearance?")) return;
    try {
      await api.patch(`/no-dues/${form.id}/finalize`);
      setForm((prev) => (prev ? { ...prev, status: "CLEARED" } : prev));
    } catch {
      alert("Failed to finalize");
    }
  };

  const allCleared = form?.lines.every((l) => l.cleared) ?? false;

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>No Due Clearance</h2>
          <div className="flex-wrap" style={{ marginBottom: "16px", gap: "12px" }}>
            <div>
              <label className="form-label">Application (Certificates Issued)</label>
              <select
                className="form-input"
                style={{ minWidth: "320px" }}
                value={applicationId}
                onChange={(e) => setApplicationId(e.target.value)}
              >
                <option value="">-- Select application --</option>
                {appsLoading && <option disabled>Loading...</option>}
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.application_no} — {a.student_name} {a.student_surname} ({a.status.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={loadForm} disabled={!applicationId || loading}>
              {loading ? "Loading..." : "Load No-Due Form"}
            </button>
          </div>
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
        </div>
      </div>

      {form && (
        <div className="panel">
          <div className="panel-body">
            <div className="flex-between" style={{ marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Clearance Items</h3>
                <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                  Ref: {form.no_due_ref} | Status:{" "}
                  <span style={{ color: form.status === "CLEARED" ? "#166534" : "#92400e", fontWeight: 600 }}>{form.status}</span>
                </p>
              </div>
              {allCleared && form.status !== "CLEARED" && (
                <button className="btn btn-primary" onClick={handleFinalize}>
                  Finalize Clearance
                </button>
              )}
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Cleared At</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => (
                    <tr key={line.id}>
                      <td style={{ color: "var(--text-secondary)" }}>{idx + 1}</td>
                      <td style={{ fontWeight: 500 }}>{line.item_name}</td>
                      <td>
                        <span className={`badge ${line.cleared ? "badge-success" : "badge-warning"}`}>
                          {line.cleared ? "Cleared" : "Pending"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {line.cleared_at ? new Date(line.cleared_at).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{line.remarks || "-"}</td>
                      <td>
                        {!line.cleared && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleClearLine(line.id)}
                            disabled={clearingId === line.id}
                          >
                            {clearingId === line.id ? "Clearing..." : "Mark Cleared"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoDueClearance;
