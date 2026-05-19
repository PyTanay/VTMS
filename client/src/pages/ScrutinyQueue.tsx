import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import EmployeeSearch from "../components/EmployeeSearch";
import { useToast } from "../context/ToastContext";

const ScrutinyQueue: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInCharge, setSelectedInCharge] = useState<any>(null);
  const [activeAppId, setActiveAppId] = useState<number | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get("/applications", { params: { perPage: 100 } });
      setApplications(
        (res.data.data || []).filter((a: any) => ["SUBMITTED", "PENDING_APPROVAL", "APPROVED", "RECEIVED_BY_TC"].includes(a.status)),
      );
    } catch {
      addToast("error", "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  const handleScrutinize = async (appId: number) => {
    if (!selectedInCharge) return addToast("warning", "Select a training in-charge first");
    try {
      await api.post(`/scrutiny/${appId}`, {
        scrutiny_in_charge_id: selectedInCharge.id,
        scrutiny_date: new Date().toISOString().slice(0, 10),
        scrutiny_remarks: `Assigned to ${selectedInCharge.name}`,
        status: "SCRUTINIZED",
      });
      addToast("success", `Scrutinized → Assigned to ${selectedInCharge.name}`);
      setActiveAppId(null);
      setSelectedInCharge(null);
      await loadQueue();
    } catch (err: any) {
      addToast("error", err?.response?.data?.message || "Scrutiny failed");
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <h2 style={{ margin: "0 0 4px", fontSize: "18px" }}>Scrutiny Queue</h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "4px", marginBottom: "16px", fontSize: "14px" }}>
            Applications awaiting scrutiny. Select an in-charge and assign. Total: {applications.length}
          </p>

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : applications.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No applications pending scrutiny.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>App No</th>
                    <th>Student</th>
                    <th>College</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Assign In-Charge</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 500, fontSize: "13px" }}>{app.application_no}</td>
                      <td>
                        {app.student_name} {app.student_surname}
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.college?.college_name || "-"}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{app.branch?.branch_name || "-"}</td>
                      <td>
                        <span className="badge badge-warning" style={{ fontSize: "11px" }}>
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td style={{ minWidth: "250px" }}>
                        {activeAppId === app.id ? (
                          <EmployeeSearch
                            onSelect={(emp) => setSelectedInCharge(emp)}
                            selectedEmployee={selectedInCharge}
                            placeholder="Search in-charge by name/EC..."
                          />
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => setActiveAppId(app.id)}>
                            Select In-Charge
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleScrutinize(app.id)}
                            disabled={activeAppId !== app.id || !selectedInCharge}
                          >
                            ✓ Scrutinize
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => navigate(`/applications/${app.id}`)}>
                            View
                          </button>
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

export default ScrutinyQueue;
