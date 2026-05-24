import React, { useEffect, useState } from "react";
import api from "../api";

interface ApplicationItem {
  id: number;
  application_no: string;
  student_name: string;
  status: string;
}

const GatePass: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState<number | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications");
      const all: ApplicationItem[] = res.data.data || [];
      setApplications(
        all.filter((a) =>
          [
            "PERMISSION_LETTER_SENT",
            "JOINING_PENDING",
            "DOCUMENTS_VERIFIED",
            "BIODATA_COMPLETED",
            "GATE_PASS_CREATED",
            "POSTED",
            "TRAINING_ACTIVE",
          ].includes(a.status),
        ),
      );
    } catch {
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (id: number) => {
    setGenerating(id);
    try {
      const res = await api.post(`/gate-pass/${id}/generate`);
      if (res.data.data?.pdfUrl) window.open(res.data.data.pdfUrl, "_blank");
    } catch {
      alert("Failed to generate gate pass");
    } finally {
      setGenerating(null);
    }
  };

  if (loading)
    return (
      <div className="panel">
        <div className="panel-body">
          <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="panel">
        <div className="panel-body">
          <p style={{ color: "#dc2626" }}>{error}</p>
        </div>
      </div>
    );

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div className="flex-between" style={{ marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Gate Pass Management</h2>
            <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{applications.length} eligible</span>
          </div>
          {applications.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No eligible applications for gate pass.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App No</th>
                    <th>Student</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.application_no}</td>
                      <td style={{ fontWeight: 500 }}>{app.student_name}</td>
                      <td>
                        <span className="badge badge-default">{app.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleGenerate(app.id)}
                          disabled={generating === app.id}
                        >
                          {generating === app.id ? "Generating..." : "Print Gate Pass"}
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

export default GatePass;
