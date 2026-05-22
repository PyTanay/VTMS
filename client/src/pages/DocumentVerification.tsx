import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";

interface DocItem {
  id: number;
  applicationId: number;
  doc_type: string;
  file_path: string;
  verified: boolean;
  verified_at: string | null;
  remarks: string | null;
  application?: { id: number; application_no: string; student_name: string; student_surname?: string };
  verified_by?: { id: number; username: string } | null;
}

const DocumentVerification: React.FC = () => {
  const { user } = useAuth();
  const [allDocs, setAllDocs] = useState<DocItem[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addToast } = useToast();
  const [verifiedId, setVerifiedId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [verifyRemark, setVerifyRemark] = useState({ open: false, id: 0, value: "" });

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("");
  const [availableDocTypes, setAvailableDocTypes] = useState<string[]>([]);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (statusFilter) params.set("verified", statusFilter);
      if (docTypeFilter) params.set("doc_type", docTypeFilter);
      params.set("perPage", "100");

      const res = await api.get(`/document-verification?${params.toString()}`);
      const data = res.data.data || [];
      setAllDocs(data);
      setFilteredDocs(data);
      setTotal(res.data.total || data.length);
    } catch {
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, docTypeFilter]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  useEffect(() => {
    // Load available doc types for filter
    const loadDocTypes = async () => {
      try {
        const res = await api.get("/document-verification/doc-types");
        setAvailableDocTypes(res.data.data || []);
      } catch {}
    };
    loadDocTypes();
  }, []);

  const handleVerify = async () => {
    const id = verifyRemark.id;
    const remarks = verifyRemark.value.trim() || undefined;
    setVerifiedId(id);
    try {
      await api.patch(`/document-verification/${id}/verify`, { remarks });
      await loadDocs();
      addToast("success", "Document verified");
    } catch {
      addToast("error", "Failed to verify document");
    } finally {
      setVerifiedId(null);
      setVerifyRemark({ open: false, id: 0, value: "" });
    }
  };

  const handleDownload = (doc: DocItem) => {
    const url = doc.file_path.startsWith("http") ? doc.file_path : `${window.location.origin}${doc.file_path}`;
    window.open(url, "_blank");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocs();
  };

  const isAuthorized = user?.role === "ADMIN" || user?.role === "TRAINING_CENTER_SECTION_HEAD" || user?.role === "TRAINING_IN_CHARGE";

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Document Verification</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", marginBottom: "16px", fontSize: "14px" }}>
            Search and verify uploaded trainee documents. Total records: {total}
          </p>

          {/* Search & Filter Bar */}
          <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: "16px" }}>
            <div>
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-input"
                style={{ minWidth: "200px" }}
                placeholder="Search by doc type, remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                style={{ width: "140px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>
            <div>
              <label className="form-label">Doc Type</label>
              <select
                className="form-input"
                style={{ width: "180px" }}
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {availableDocTypes.map((dt) => (
                  <option key={dt} value={dt}>
                    {dt}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                setDocTypeFilter("");
              }}
            >
              Clear
            </button>
          </form>

          {error && <p style={{ color: "#dc2626", marginBottom: "12px" }}>{error}</p>}

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading documents...</p>
          ) : filteredDocs.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No documents found matching your criteria.</p>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>App No</th>
                      <th>Student</th>
                      <th>Doc Type</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Verified By</th>
                      <th>Verified At</th>
                      <th>Remarks</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 500, fontSize: "13px" }}>
                          {doc.application?.application_no || `#${doc.applicationId}`}
                        </td>
                        <td>{doc.application?.student_name || "-"}</td>
                        <td style={{ fontWeight: 500 }}>{doc.doc_type}</td>
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleDownload(doc)}
                            style={{ fontSize: "11px", padding: "3px 8px" }}
                          >
                            📄 View
                          </button>
                        </td>
                        <td>
                          <span className={`badge ${doc.verified ? "badge-success" : "badge-warning"}`}>
                            {doc.verified ? "Verified" : "Pending"}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{doc.verified_by?.username || "-"}</td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                          {doc.verified_at ? new Date(doc.verified_at).toLocaleDateString() : "-"}
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{doc.remarks || "-"}</td>
                        <td>
                          {!doc.verified && isAuthorized && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => setVerifyRemark({ open: true, id: doc.id, value: "" })}
                              disabled={verifiedId === doc.id}
                              style={{ fontSize: "11px", padding: "4px 10px" }}
                            >
                              {verifiedId === doc.id ? "..." : "Verify"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>
                Showing {filteredDocs.length} of {total} records
              </p>
            </>
          )}
        </div>
      </div>
      {/* Verify Remarks Modal */}
      <Modal
        open={verifyRemark.open}
        title="Verify Document"
        onClose={() => setVerifyRemark({ open: false, id: 0, value: "" })}
        actions={
          <>
            <button className="btn btn-outline" onClick={() => setVerifyRemark({ open: false, id: 0, value: "" })}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleVerify}>
              Verify
            </button>
          </>
        }
      >
        <div>
          <label className="form-label">Remarks (optional)</label>
          <textarea
            className="form-input"
            rows={3}
            autoFocus
            value={verifyRemark.value}
            onChange={(e) => setVerifyRemark((prev) => ({ ...prev, value: e.target.value }))}
            placeholder="Enter verification remarks..."
            style={{ width: "100%", resize: "vertical" }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default DocumentVerification;
