import React, { useEffect, useState } from "react";
import api from "../api";

interface Cert {
  id: number;
  applicationId: number;
  certificate_ref: string;
  behavioral_rating: string;
  progress_rating: string;
  actual_completion_date: string;
  report_submission_date: string;
  is_duplicate: boolean;
  duplicate_reason: string | null;
  application?: { id: number; application_no: string; student_name: string };
}
interface AppItem {
  id: number;
  application_no: string;
  student_name: string;
  status: string;
}

const CertificateComposer: React.FC = () => {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<number | null>(null);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [behavioralRating, setBehavioralRating] = useState("Good");
  const [progressRating, setProgressRating] = useState("Good");
  const [actualCompletionDate, setActualCompletionDate] = useState("");
  const [reportSubmissionDate, setReportSubmissionDate] = useState("");
  const [duplicateReason, setDuplicateReason] = useState("");
  const [duplicateTargetId, setDuplicateTargetId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([loadCerts(), loadApps()]);
  }, []);

  const loadCerts = async () => {
    try {
      const res = await api.get("/certificates");
      setCerts(res.data.data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const loadApps = async () => {
    try {
      const res = await api.get("/applications", { params: { perPage: 500 } });
      const all: AppItem[] = res.data.data || [];
      // Show apps that have completed training (POSTED, TRAINING_ACTIVE, REPORT_SUBMITTED, NO_DUES_PENDING, CERTIFICATE_READY)
      setApps(
        all.filter((a) =>
          [
            "POSTED",
            "TRAINING_ACTIVE",
            "REPORT_SUBMITTED",
            "NO_DUES_PENDING",
            "CERTIFICATE_READY",
            "CERTIFICATE_ISSUED",
            "TRAINING_COMPLETED",
          ].includes(a.status),
        ),
      );
    } catch {}
  };

  const handleCreate = async () => {
    if (!selectedAppId) return alert("Select an application");
    try {
      await api.post("/certificates", {
        applicationId: Number(selectedAppId),
        behavioral_rating: behavioralRating,
        progress_rating: progressRating,
        actual_completion_date: actualCompletionDate || undefined,
        report_submission_date: reportSubmissionDate || undefined,
      });
      setSelectedAppId("");
      setBehavioralRating("Good");
      setProgressRating("Good");
      setActualCompletionDate("");
      setReportSubmissionDate("");
      await loadCerts();
    } catch {
      alert("Failed to create certificate");
    }
  };

  const handleGenerate = async (id: number) => {
    setGenerating(id);
    try {
      const res = await api.post(`/certificates/${id}/generate`);
      if (res.data.data?.pdfUrl) window.open(res.data.data.pdfUrl, "_blank");
    } catch {
      alert("Failed");
    } finally {
      setGenerating(null);
    }
  };

  const handleApproveDuplicate = async (id: number) => {
    if (!duplicateReason.trim()) return alert("Enter a reason");
    try {
      await api.patch(`/certificates/${id}/approve-duplicate`, {
        duplicate_approved_by: "Section Head",
        duplicate_reason: duplicateReason,
      });
      setDuplicateReason("");
      setDuplicateTargetId(null);
      await loadCerts();
    } catch {
      alert("Failed");
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Issue Certificate</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="form-label">Application *</label>
              <select className="form-input" value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)}>
                <option value="">-- Select --</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.application_no} - {a.student_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Behavioral Rating</label>
              <select className="form-input" value={behavioralRating} onChange={(e) => setBehavioralRating(e.target.value)}>
                {["Excellent", "Good", "Average", "Poor"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Progress Rating</label>
              <select className="form-input" value={progressRating} onChange={(e) => setProgressRating(e.target.value)}>
                {["Excellent", "Good", "Average", "Poor"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Actual Completion Date</label>
              <input
                type="date"
                className="form-input"
                value={actualCompletionDate}
                onChange={(e) => setActualCompletionDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Report Submission Date</label>
              <input
                type="date"
                className="form-input"
                value={reportSubmissionDate}
                onChange={(e) => setReportSubmissionDate(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: "16px" }} onClick={handleCreate} disabled={!selectedAppId}>
            Create Certificate
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ marginBottom: "12px" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Issued Certificates</h2>
          </div>
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : certs.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No certificates issued yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Student</th>
                    <th>Behavioral</th>
                    <th>Progress</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.certificate_ref}</td>
                      <td>{c.application?.student_name || `App #${c.applicationId}`}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.behavioral_rating}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.progress_rating}</td>
                      <td>
                        <span className={`badge ${c.is_duplicate ? "badge-warning" : "badge-info"}`}>
                          {c.is_duplicate ? "Duplicate" : "Original"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleGenerate(c.id)}
                            disabled={generating === c.id}
                          >
                            {generating === c.id ? "..." : "Download PDF"}
                          </button>
                          {!c.is_duplicate && duplicateTargetId === c.id ? (
                            <>
                              <input
                                className="form-input"
                                style={{ width: "160px", padding: "5px 8px", fontSize: "12px" }}
                                placeholder="Reason"
                                value={duplicateReason}
                                onChange={(e) => setDuplicateReason(e.target.value)}
                              />
                              <button className="btn btn-primary btn-sm" onClick={() => handleApproveDuplicate(c.id)}>
                                Approve
                              </button>
                              <button className="btn btn-outline btn-sm" onClick={() => setDuplicateTargetId(null)}>
                                Cancel
                              </button>
                            </>
                          ) : !c.is_duplicate ? (
                            <button className="btn btn-outline btn-sm" onClick={() => setDuplicateTargetId(c.id)}>
                              Mark Duplicate
                            </button>
                          ) : null}
                        </div>
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

export default CertificateComposer;
