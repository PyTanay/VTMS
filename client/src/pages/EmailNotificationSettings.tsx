import React, { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";

interface EmailConfig {
  id: number;
  type: string;
  enabled: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  GLOBAL: "Global Email Toggle",
  APPROVAL: "Approval Notifications",
  PERMISSION: "Permission Letter Notifications",
  CERTIFICATE: "Certificate Notifications",
  NODUE: "No Due Clearance Notifications",
  REMINDER: "Automated Reminders",
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  GLOBAL: "Master switch — disables ALL outgoing emails across the system",
  APPROVAL: "Sent to recommending employees when an application needs approval",
  PERMISSION: "Sent when permission letters are issued to colleges",
  CERTIFICATE: "Sent when certificates are generated",
  NODUE: "Sent when no due clearance is completed",
  REMINDER: "Daily automated reminder emails for pending actions (8AM & 2PM)",
};

const EmailNotificationSettings: React.FC = () => {
  const { addToast } = useToast();
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/email-config");
      setConfigs(res.data.data || []);
    } catch {
      addToast("error", "Failed to load email config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (type: string, current: boolean) => {
    try {
      const res = await api.patch(`/email-config/${type}`, { enabled: !current });
      setConfigs((prev) => prev.map((c) => (c.type === type ? { ...c, enabled: res.data.data.enabled } : c)));
      addToast("success", `${TYPE_LABELS[type] || type} ${!current ? "enabled" : "disabled"}`);
    } catch {
      addToast("error", "Failed to update");
    }
  };

  return (
    <div className="page-gap">
      <div className="panel">
        <div className="panel-body">
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px" }}>Email Notification Settings</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: "4px", fontSize: "14px" }}>
              Control which types of emails are sent by the system
            </p>
          </div>

          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((c) => (
                    <tr key={c.type}>
                      <td style={{ fontWeight: 500 }}>{TYPE_LABELS[c.type] || c.type}</td>
                      <td>
                        <span className={`badge ${c.enabled ? "badge-success" : "badge-error"}`}>
                          {c.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{TYPE_DESCRIPTIONS[c.type] || "-"}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => toggle(c.type, c.enabled)}>
                          {c.enabled ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>
                {configs.length} notification types configured
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailNotificationSettings;
