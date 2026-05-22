import React, { useEffect, useState } from "react";
import api from "../api";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";

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
  const { addToast } = useToast();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(true);
  const [error, setError] = useState("");
  const [clearingId, setClearingId] = useState<number | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [remarkInput, setRemarkInput] = useState({ open: false, lineId: 0, value: "" });

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
    setRemarkInput({ open: true, lineId, value: "" });
  };

  const submitClearLine = async () => {
    const { lineId, value } = remarkInput;
    if (!value.trim()) return addToast("error", "Remarks are required");
    setClearingId(lineId);
    try {
      const res = await api.patch(`/no-dues/line/${lineId}/clear`, { remarks: value.trim() });
      setForm((prev) => (prev ? { ...prev, lines: prev.lines.map((l) => (l.id === lineId ? res.data.data : l)) } : prev));
      addToast("success", "Line cleared");
    } catch {
      addToast("error", "Failed");
    } finally {
      setClearingId(null);
      setRemarkInput({ open: false, lineId: 0, value: "" });
    }
  };

  const handleFinalizeNow = async () => {
    if (!form) return;
    try {
      await api.patch(`/no-dues/${form.id}/finalize`);
      setForm((prev) => (prev ? { ...prev, status: "CLEARED" } : prev));
      addToast("success", "No-due clearance finalized");
    } catch {
      addToast("error", "Failed to finalize");
    }
    setConfirmFinalize(false);
  };

  const handleGeneratePdf = async () => {
    if (!form) return;
    setGeneratingPdf(true);
    try {
      const res = await api.post(`/no-dues/${form.id}/generate`);
      const pdfUrl = res.data.data?.pdfUrl;
      if (pdfUrl) window.open(pdfUrl, "_blank");
      addToast("success", "PDF generated");
    } catch {
      addToast("error", "Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
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
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-outline" onClick={handleGeneratePdf} disabled={generatingPdf}>
                  {generatingPdf ? "Generating..." : "📄 Download PDF"}
                </button>
                {allCleared && form.status !== "CLEARED" && (
                  <button className="btn btn-primary" onClick={() => setConfirmFinalize(true)}>
                    Finalize Clearance
                  </button>
                )}
              </div>
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
      {/* Remarks Input Modal */}
      <Modal
        open={remarkInput.open}
        title="Enter Remarks"
        onClose={() => setRemarkInput({ open: false, lineId: 0, value: "" })}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setRemarkInput({ open: false, lineId: 0, value: "" })}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={submitClearLine}>
              Confirm
            </button>
          </>
        }
      >
        <div>
          <label className="form-label">Remarks *</label>
          <textarea
            className="form-input"
            rows={3}
            autoFocus
            value={remarkInput.value}
            onChange={(e) => setRemarkInput((prev) => ({ ...prev, value: e.target.value }))}
            placeholder="Enter clearance remarks..."
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>
      </Modal>

      {/* Finalize Confirmation Modal */}
      <Modal
        open={confirmFinalize}
        title="Confirm Finalize"
        onClose={() => setConfirmFinalize(false)}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setConfirmFinalize(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleFinalizeNow}>
              Yes, Finalize
            </button>
          </>
        }
      >
        <p>Are you sure you want to finalize this no-due clearance? This marks all items as cleared.</p>
      </Modal>
    </div>
  );
};

export default NoDueClearance;
