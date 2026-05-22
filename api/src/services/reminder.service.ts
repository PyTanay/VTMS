import prisma from "../prisma";
import { sendEmail } from "../utils/email";

interface ReminderConfig {
  label: string;
  statusFilter: string[];
  daysThreshold: number;
  getRecipients: (app: any) => { email: string; name: string }[];
  getSubject: (app: any) => string;
  getBody: (app: any) => string;
}

const REMINDER_TYPES: Record<string, ReminderConfig> = {
  PENDING_APPROVAL: {
    label: "Pending Approval",
    statusFilter: ["SUBMITTED", "PENDING_APPROVAL"],
    daysThreshold: 2,
    getRecipients: (app) => {
      const recipients: { email: string; name: string }[] = [];
      if (app.recommending_employee?.email) {
        recipients.push({ email: app.recommending_employee.email, name: app.recommending_employee.name });
      }
      return recipients;
    },
    getSubject: (app) => `Reminder: Application ${app.application_no} pending approval`,
    getBody: (app) =>
      `Dear ${app.recommending_employee?.name || "Approver"},<br><br>` +
      `This is a reminder that the vocational training application for <strong>${app.student_name} ${app.student_surname}</strong>` +
      ` (App No: ${app.application_no}) is awaiting your approval since ${new Date(app.application_date).toLocaleDateString()}.<br><br>` +
      `Please log in to the VTMS portal to take action.<br><br>Regards,<br>VTMS System`,
  },
  PENDING_SCRUTINY: {
    label: "Pending Scrutiny",
    statusFilter: ["RECEIVED_BY_TC"],
    daysThreshold: 2,
    getRecipients: () => {
      // Will notify all SCRUTINY_OFFICER / ADMIN users
      return []; // handled separately below
    },
    getSubject: (app) => `Reminder: Application ${app.application_no} pending scrutiny`,
    getBody: (app) =>
      `Dear Scrutiny Officer,<br><br>` +
      `Application <strong>${app.application_no}</strong> for ${app.student_name} ${app.student_surname}` +
      ` has been received by training center and is pending scrutiny.<br><br>` +
      `Please review in the VTMS portal.<br><br>Regards,<br>VTMS System`,
  },
  PENDING_DOCUMENTS: {
    label: "Pending Documents",
    statusFilter: ["PERMISSION_LETTER_SENT", "JOINING_PENDING"],
    daysThreshold: 2,
    getRecipients: (app) => {
      const recipients: { email: string; name: string }[] = [];
      if (app.recommending_employee?.email) {
        recipients.push({ email: app.recommending_employee.email, name: app.recommending_employee.name });
      }
      return recipients;
    },
    getSubject: (app) => `Reminder: Documents pending for ${app.application_no}`,
    getBody: (app) =>
      `Dear ${app.recommending_employee?.name || "Employee"},<br><br>` +
      `The student <strong>${app.student_name} ${app.student_surname}</strong> (App No: ${app.application_no})` +
      ` has been issued a permission letter. Please ensure the required documents are uploaded.<br><br>` +
      `Log in to VTMS to complete the process.<br><br>Regards,<br>VTMS System`,
  },
  PENDING_REPORT: {
    label: "Pending Report Submission",
    statusFilter: ["TRAINING_COMPLETED"],
    daysThreshold: 3,
    getRecipients: (app) => {
      const recipients: { email: string; name: string }[] = [];
      if (app.recommending_employee?.email) {
        recipients.push({ email: app.recommending_employee.email, name: app.recommending_employee.name });
      }
      return recipients;
    },
    getSubject: (app) => `Reminder: Training report pending for ${app.application_no}`,
    getBody: (app) =>
      `Dear ${app.recommending_employee?.name || "Employee"},<br><br>` +
      `The training for <strong>${app.student_name} ${app.student_surname}</strong> (App No: ${app.application_no})` +
      ` has been completed. Please submit the training report.<br><br>` +
      `Log in to VTMS to submit the report.<br><br>Regards,<br>VTMS System`,
  },
  PENDING_CERTIFICATE: {
    label: "Pending Certificate Issuance",
    statusFilter: ["REPORT_SUBMITTED"],
    daysThreshold: 3,
    getRecipients: () => [], // handled separately for ADMIN/SECTION_HEAD
    getSubject: (app) => `Reminder: Certificate pending for ${app.application_no}`,
    getBody: (app) =>
      `Dear Training Center,<br><br>` +
      `The training report for <strong>${app.student_name} ${app.student_surname}</strong>` +
      ` (App No: ${app.application_no}) has been submitted. Please issue the certificate.<br><br>` +
      `Log in to VTMS to proceed.<br><br>Regards,<br>VTMS System`,
  },
};

/**
 * Find admin/section-head users to notify for generic reminders
 */
const getAdminRecipients = async (): Promise<{ email: string; name: string }[]> => {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ role: "ADMIN" }, { role: "TRAINING_CENTER_SECTION_HEAD" }],
      active: true,
      suspended: false,
      email: { not: "" },
    },
    select: { email: true, username: true },
  });
  return users.map((u) => ({ email: u.email, name: u.username }));
};

/**
 * Run all reminders
 */
export const runReminders = async (): Promise<{ type: string; sent: number }[]> => {
  const results: { type: string; sent: number }[] = [];

  for (const [key, config] of Object.entries(REMINDER_TYPES)) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - config.daysThreshold);

    try {
      const apps = await prisma.application.findMany({
        where: {
          status: { in: config.statusFilter as any },
          application_date: { lte: thresholdDate },
        },
        include: {
          recommending_employee: {
            select: { name: true, email: true },
          },
        },
        take: 50, // limit per run to avoid overload
      });

      let sent = 0;

      for (const app of apps) {
        const recipients = config.getRecipients(app);

        // If no direct recipients, notify admin users
        const finalRecipients = recipients.length > 0 ? recipients : await getAdminRecipients();

        for (const recipient of finalRecipients) {
          if (!recipient.email) continue;
          const ok = await sendEmail(
            recipient.email,
            `[REMINDER] ${config.getSubject(app)}`,
            `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1e40af;">VTMS Reminder</h2>
              <p>${config.getBody(app)}</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="font-size: 12px; color: #6b7280;">This is an automated reminder from VTMS. Please do not reply.</p>
            </div>`,
          );
          if (ok) sent++;
        }
      }

      if (sent > 0) {
        console.log(`[REMINDER] ${config.label}: Sent ${sent} reminders for ${apps.length} applications`);
      }
      results.push({ type: key, sent });
    } catch (error) {
      console.error(`[REMINDER] Error processing ${key}:`, error);
      results.push({ type: key, sent: 0 });
    }
  }

  return results;
};

export const getReminderSummary = async () => {
  const counts: Record<string, number> = {};
  for (const [key, config] of Object.entries(REMINDER_TYPES)) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - config.daysThreshold);
    const count = await prisma.application.count({
      where: {
        status: { in: config.statusFilter as any },
        application_date: { lte: thresholdDate },
      },
    });
    counts[key] = count;
  }
  return counts;
};
