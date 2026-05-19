import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";

interface CertItem {
  id: number;
  certificate_ref: string;
  application_no: string;
  student_name: string;
  student_surname: string;
  course_name: string;
  is_duplicate: boolean;
  issued_at: string | null;
  application_id: number;
}

const CertificateAcknowledgement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<number | null>(null);
  const [error, setError] = useState("");

  const canIssue = user?.role === "ADMIN" || user?.role === "TRAINING_CENTER_SECTION_HEAD";

  useEffect(() => {
    loadCerts();
  }, []);

  const loadCerts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/certificates");
      setCerts(res.data.data || []);
    } catch {
      setError("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async (id: number) => {
    setIssuing(id);
    try {
      await api.patch(`/certificates/${id}/issue`, {});
      await loadCerts();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to issue certificate");
    } finally {
      setIssuing(null);
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Certificate Acknowledgement</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", marginBottom: "16px", fontSize: "14px" }}>
            Issue certificates and track issuance status.
          </p>

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
          ) : certs.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No certificates found.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Certificate Ref</th>
                    <th>Student</th>
                    <th>Application</th>
                    <th>Course</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500, fontSize: "13px" }}>{c.certificate_ref}</td>
                      <td>
                        {c.student_name} {c.student_surname}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{c.application_no}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{c.course_name}</td>
                      <td>
                        <span className={`badge ${c.is_duplicate ? "badge-warning" : "badge-info"}`} style={{ fontSize: "11px" }}>
                          {c.is_duplicate ? "Duplicate" : "Original"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${c.issued_at ? "badge-success" : "badge-default"}`} style={{ fontSize: "11px" }}>
                          {c.issued_at ? "Issued" : "Pending"}
                        </span>
                      </td>
                      <td>
                        {c.issued_at ? (
                          <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                            Issued: {new Date(c.issued_at).toLocaleDateString()}
                          </span>
                        ) : (
                          canIssue && (
                            <button className="btn btn-primary btn-sm" onClick={() => handleIssue(c.id)} disabled={issuing === c.id}>
                              {issuing === c.id ? "..." : "Acknowledge & Issue"}
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>Total: {certs.length}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateAcknowledgement;
