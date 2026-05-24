import React, { useEffect, useState } from "react";
import api from "../api";
import { useToast } from "../context/ToastContext";

interface EmailConfig {
  id: number;
  type: string;
  enabled: boolean;
  dev_mode?: boolean;
}

interface UserEmailPreferences {
  id: number;
  username: string;
  emailPreferences: Record<string, boolean>;
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

const NOTIFICATION_TYPES = ["GLOBAL", "APPROVAL", "PERMISSION", "CERTIFICATE", "NODUE", "REMINDER"];

const EmailNotificationSettings: React.FC = () => {
  const { addToast } = useToast();
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserEmailPreferences[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [masterToggleLoading, setMasterToggleLoading] = useState(false);

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

  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get("/users");
      const usersWithPrefs = (res.data.data || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        emailPreferences: u.emailPreferences || {},
      }));
      setAllUsers(usersWithPrefs);
    } catch {
      addToast("error", "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAllUsers();
  }, []);

  const toggle = async (type: string, field: "enabled" | "dev_mode", current: boolean) => {
    try {
      const res = await api.patch(`/email-config/${type}`, { [field]: !current });
      setConfigs((prev) => prev.map((c) => (c.type === type ? { ...c, [field]: res.data.data[field] } : c)));
      if (field === "dev_mode") {
        addToast("success", `Dev Mode ${!current ? "enabled" : "disabled"} - all emails will be redirected to tjdesai@gnfc.in`);
      } else {
        addToast("success", `${TYPE_LABELS[type] || type} ${!current ? "enabled" : "disabled"}`);
      }
    } catch {
      addToast("error", "Failed to update");
    }
  };

  // Check if all notifications are enabled
  const allEnabled = NOTIFICATION_TYPES.every((type) => {
    const config = configs.find((c) => c.type === type);
    return config?.enabled !== false;
  });

  // Master toggle for all notifications
  const toggleAllNotifications = async (enabled: boolean) => {
    setMasterToggleLoading(true);
    try {
      for (const type of NOTIFICATION_TYPES) {
        const config = configs.find((c) => c.type === type);
        if (config && config.enabled !== enabled) {
          await api.patch(`/email-config/${type}`, { enabled });
        }
      }
      await load();
      addToast("success", `All notifications ${enabled ? "enabled" : "disabled"}`);
    } catch {
      addToast("error", "Failed to update all notifications");
    } finally {
      setMasterToggleLoading(false);
    }
  };

  // Toggle all notifications for a specific user
  const toggleUserNotifications = async (userId: number, enabled: boolean) => {
    try {
      await api.put(`/users/${userId}/toggle-all-notifications`, { enabled });
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                emailPreferences: { ...u.emailPreferences, ...Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t, enabled])) },
              }
            : u,
        ),
      );
      addToast("success", `${enabled ? "Enabled" : "Disabled"} all notifications for user`);
    } catch {
      addToast("error", "Failed to update user notifications");
    }
  };

  // Check if all user notifications are enabled
  const isUserAllEnabled = (user: UserEmailPreferences) => {
    return NOTIFICATION_TYPES.every((type) => user.emailPreferences[type] !== false);
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
            <>
              {/* Master Toggle Section */}
              <div style={{ marginBottom: "20px", padding: "16px", background: "var(--nav-hover, #f1f5f9)", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>Master Toggle</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                      Enable or disable all email notifications at once
                    </p>
                  </div>
                  <button
                    className={`btn ${allEnabled ? "btn-primary" : "btn-outline"}`}
                    onClick={() => toggleAllNotifications(!allEnabled)}
                    disabled={masterToggleLoading}
                  >
                    {masterToggleLoading ? "Updating..." : allEnabled ? "Disable All" : "Enable All"}
                  </button>
                </div>
              </div>

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
                          <button className="btn btn-outline btn-sm" onClick={() => toggle(c.type, "enabled", c.enabled)}>
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

              {/* Dev Mode Toggle - separate section */}
              {configs.find((c) => c.type === "GLOBAL") && (
                <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
                  <h3 style={{ margin: 0, fontSize: "16px", marginBottom: "12px" }}>Developer Mode</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "12px" }}>
                    When enabled, all outgoing emails will be redirected to <strong>tjdesai@gnfc.in</strong> for testing purposes.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      className={`btn ${configs.find((c) => c.type === "GLOBAL")?.dev_mode ? "btn-primary" : "btn-outline"}`}
                      onClick={() => {
                        const global = configs.find((c) => c.type === "GLOBAL");
                        if (global) toggle("GLOBAL", "dev_mode", global.dev_mode || false);
                      }}
                    >
                      {configs.find((c) => c.type === "GLOBAL")?.dev_mode ? "Dev Mode ON" : "Enable Dev Mode"}
                    </button>
                    {configs.find((c) => c.type === "GLOBAL")?.dev_mode && (
                      <span className="badge badge-warning">Active - Emails redirected</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* User Notification Preferences Section */}
          <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
            <h2 style={{ margin: 0, fontSize: "18px", marginBottom: "16px" }}>User Notification Preferences</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
              Control which notifications each user receives. Users inherit the global settings by default.
            </p>

            {usersLoading ? (
              <p style={{ color: "var(--text-secondary)" }}>Loading users...</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>All Notifications</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user) => (
                      <tr key={user.id}>
                        <td style={{ fontWeight: 500 }}>{user.username}</td>
                        <td>
                          <span className={`badge ${isUserAllEnabled(user) ? "badge-success" : "badge-default"}`}>
                            {isUserAllEnabled(user) ? "All Enabled" : "Custom"}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${isUserAllEnabled(user) ? "btn-outline" : "btn-primary"}`}
                            onClick={() => toggleUserNotifications(user.id, !isUserAllEnabled(user))}
                          >
                            {isUserAllEnabled(user) ? "Disable All" : "Enable All"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>{allUsers.length} users</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailNotificationSettings;
