import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

interface ReportDef {
  name: string;
  label: string;
}

const REPORT_LIST: ReportDef[] = [
  { name: "application-register", label: "Application Register" },
  { name: "approved", label: "Approved Applications" },
  { name: "permissions", label: "Permissions Given" },
  { name: "branch-wise", label: "Branch Wise" },
  { name: "college-wise", label: "College Wise" },
  { name: "training-completed", label: "Training Completed" },
  { name: "incharge-wise", label: "In-Charge Wise" },
  { name: "college-wise-apps", label: "College Wise Applications" },
  { name: "dept-posting", label: "Department Wise Posting" },
  { name: "recommended-by", label: "Recommended by Employee" },
  { name: "other-references", label: "Other References" },
  { name: "employee-children", label: "Employee's Son/Daughter" },
  { name: "training-during-fy", label: "Training During Financial Year" },
];

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<Record<string, any>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentLabel = REPORT_LIST.find((r) => r.name === selectedReport)?.label ?? "Report";

  const fetchReport = async (format?: string) => {
    if (!selectedReport) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      if (format) params.set("format", format);

      const url = `/reports/${selectedReport}${params.toString() ? `?${params.toString()}` : ""}`;

      if (format === "csv") {
        const res = await api.get(url, { responseType: "blob" });
        const blob = new Blob([res.data], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedReport}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
        return;
      }

      const res = await api.get(url);
      const rows: Record<string, any>[] = res.data.data || [];
      setData(rows);
      setColumns(rows.length > 0 ? Object.keys(rows[0]) : []);
    } catch {
      setError("Failed to load report");
      setData(null);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAppClick = (appId: number) => {
    navigate(`/applications/${appId}`);
  };

  const renderCell = (row: Record<string, any>, col: string) => {
    // Handle Applications column (array of {id, no, student})
    if (col === "Applications" && Array.isArray(row[col])) {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {row[col].map((app: { id: number; no: string; student: string }) => (
            <span
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              style={{
                cursor: "pointer",
                color: "var(--primary-accent)",
                textDecoration: "underline",
                fontSize: "13px",
              }}
            >
              {app.no} ({app.student})
            </span>
          ))}
        </div>
      );
    }
    return row[col] ?? "-";
  };

  const handleCellClick = (row: Record<string, any>, col: string) => {
    // Make App No cells clickable to navigate to application details
    if (col === "App No" && row["App No"]) {
      // Fetch application by application_no to get ID
      api
        .get(`/applications?search=${row["App No"]}&perPage=1`)
        .then((res) => {
          const apps = res.data?.data || [];
          if (apps.length > 0) {
            navigate(`/applications/${apps[0].id}`);
          }
        })
        .catch(() => {
          // Silently fail if we can't fetch
        });
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Reports</h2>
          <div className="flex-wrap" style={{ marginBottom: "16px" }}>
            <div>
              <label className="form-label">Report</label>
              <select
                className="form-input"
                style={{ minWidth: "260px" }}
                value={selectedReport}
                onChange={(e) => {
                  setSelectedReport(e.target.value);
                  setData(null);
                }}
              >
                <option value="">-- Select Report --</option>
                {REPORT_LIST.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">From</label>
              <input type="date" className="form-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">To</label>
              <input type="date" className="form-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => fetchReport()} disabled={!selectedReport || loading}>
              {loading ? "Loading..." : "Run Report"}
            </button>
            {data && data.length > 0 && (
              <button className="btn btn-outline" onClick={() => fetchReport("csv")}>
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          {error && <p style={{ color: "#dc2626", marginBottom: "12px" }}>{error}</p>}
          {!data && !loading && !error && <p style={{ color: "var(--text-secondary)" }}>Select a report and click "Run Report".</p>}
          {loading && <p style={{ color: "var(--text-secondary)" }}>Loading report...</p>}
          {data && (
            <>
              <div className="flex-between" style={{ marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>{currentLabel}</h3>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  {data.length} record{data.length !== 1 ? "s" : ""}
                </span>
              </div>
              {data.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No records found.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx}>
                          {columns.map((col) => (
                            <td key={col} onClick={() => handleCellClick(row, col)}>
                              {renderCell(row, col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
