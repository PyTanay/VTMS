import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import prisma from "../prisma";
import { logger } from "./logger";

const log = logger.child("EMAIL");

// ── Config with validation & fallback ──
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "noreply@gnfc.in";

// ── Dev Mode: redirect all emails to dev inbox ──
const DEV_EMAIL = process.env.DEV_EMAIL || "tjdesai@gnfc.in";
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== "false"; // default true

// ── Lazy transporter creation (so we don't fail on startup if SMTP is down) ──
let transporter: nodemailer.Transporter | null = null;
let emailConfigured = false;

const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;
  if (!SMTP_HOST) {
    log.warn("SMTP_HOST not configured. Email sending is disabled.");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    connectionTimeout: 5000, // 5s connect timeout
    greetingTimeout: 5000, // 5s greeting timeout
    socketTimeout: 10000, // 10s socket timeout
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs for internal mail
    },
  });
  emailConfigured = true;
  return transporter;
};

const templateDir = path.join(__dirname, "..", "templates");

const compileTemplate = (templateName: string): Handlebars.TemplateDelegate => {
  const filePath = path.join(templateDir, `${templateName}.hbs`);
  if (!fs.existsSync(filePath)) {
    log.warn(`Template not found: ${filePath}`);
    return (data: any) => `<p>${JSON.stringify(data)}</p>`;
  }
  const source = fs.readFileSync(filePath, "utf-8");
  return handlebars.compile(source);
};

const approvalTemplate = compileTemplate("approval-request");
const permissionLetterTemplate = compileTemplate("permission-letter-notification");
const noDueClearanceTemplate = compileTemplate("no-due-clearance");

// Check if dev mode is enabled from database
const isDevModeEnabled = async (): Promise<boolean> => {
  try {
    const config = await prisma.emailConfig.findUnique({ where: { type: "GLOBAL" } });
    return (config as any)?.dev_mode ?? false;
  } catch {
    return false;
  }
};

export const sendEmail = async (to: string, subject: string, html: string, type?: string): Promise<boolean> => {
  const emailLogMeta: Record<string, any> = { to, subject, type };

  // Check global email toggle
  if (!EMAIL_ENABLED) {
    log.info("Globally disabled — skipping send", emailLogMeta);
    return false;
  }

  // Check per-employee email suppression
  try {
    const emp = await prisma.employee.findFirst({ where: { email: to, receive_emails: false } });
    if (emp) {
      log.info(`Employee ${emp.name} (${emp.employee_no}) opted out — skipping`, emailLogMeta);
      return false;
    }
  } catch {
    // If DB query fails, allow send through (fail open)
    log.warn("Could not check employee suppression, proceeding with send", emailLogMeta);
  }

  // Check per-type email config
  if (type) {
    try {
      const config = await prisma.emailConfig.findUnique({ where: { type } });
      if (config && !config.enabled) {
        log.info(`Type "${type}" disabled in config — skipping`, emailLogMeta);
        return false;
      }
    } catch {
      log.warn(`Could not check config for type "${type}", proceeding with send`, emailLogMeta);
    }
  }

  const t = getTransporter();
  if (!t) {
    log.info("SMTP not configured — skipping", emailLogMeta);
    return false;
  }

  // Dev mode: redirect all emails to DEV_EMAIL
  let actualRecipient = to;
  const devMode = await isDevModeEnabled();
  if (devMode) {
    actualRecipient = DEV_EMAIL;
    log.info(`DEV MODE: Redirecting email to ${DEV_EMAIL} (original: ${to})`, { originalTo: to });
    // Append original recipient info to subject for debugging
    subject = `[DEV MODE → ${to}] ${subject}`;
  }

  try {
    const info = await t.sendMail({
      from: `"VTMS Portal" <${SMTP_FROM}>`,
      to: actualRecipient,
      subject,
      html,
    });
    log.info(`Email sent to ${actualRecipient}`, {
      messageId: info.messageId,
      originalTo: actualRecipient !== to ? to : undefined,
      subject,
    });
    return true;
  } catch (error: any) {
    log.error(`Error sending to ${actualRecipient}`, error, { code: error?.code });
    return false;
  }
};

export const generateApprovalLink = (applicationId: number, approverId: number, action: "approve" | "reject") => {
  const payload = { applicationId, approverId, action };
  const token = jwt.sign(payload, process.env.JWT_SECRET || "secret", { expiresIn: "48h" });
  const baseUrl = process.env.SERVER_URL || "http://localhost:3000";
  return `${baseUrl}/api/applications/${applicationId}/${action}?token=${token}`;
};

export const sendApprovalEmail = async (
  to: string,
  approverName: string,
  studentName: string,
  applicationId: number,
  approverId: number,
  applicationNo?: string,
  collegeName?: string,
) => {
  const approveLink = generateApprovalLink(applicationId, approverId, "approve");
  const rejectLink = generateApprovalLink(applicationId, approverId, "reject");
  const html = approvalTemplate({
    approverName,
    studentName,
    applicationNo: applicationNo || String(applicationId),
    collegeName: collegeName || "-",
    submittedOn: new Date().toLocaleDateString(),
    approveLink,
    rejectLink,
  });
  log.info("Sending approval request email", { to, studentName, applicationNo });
  return sendEmail(to, `Action Required: Vocational Training Request for ${studentName}`, html);
};

export const sendPermissionLetterNotification = async (
  to: string,
  studentName: string,
  applicationNo: string,
  permissionRef: string,
  collegeName?: string,
) => {
  const html = permissionLetterTemplate({
    studentName,
    applicationNo,
    permissionRef,
    collegeName: collegeName || "-",
    issuedOn: new Date().toLocaleDateString(),
  });
  log.info("Sending permission letter notification", { to, studentName, applicationNo, permissionRef });
  return sendEmail(to, `Permission Letter Issued — ${applicationNo}`, html);
};

export const sendNoDueClearanceNotification = async (to: string, studentName: string, applicationNo: string, noDueRef: string) => {
  const html = noDueClearanceTemplate({
    studentName,
    applicationNo,
    noDueRef,
    completedOn: new Date().toLocaleDateString(),
  });
  log.info("Sending no-due clearance notification", { to, studentName, applicationNo, noDueRef });
  return sendEmail(to, `No Due Clearance Completed — ${applicationNo}`, html);
};

export const testEmailConnection = async (): Promise<{ ok: boolean; message: string }> => {
  const t = getTransporter();
  if (!t) return { ok: false, message: "SMTP not configured" };
  try {
    await t.verify();
    log.info("SMTP connection verified");
    return { ok: true, message: "SMTP connection verified" };
  } catch (error: any) {
    log.error("SMTP connection verification failed", error);
    return { ok: false, message: `SMTP error: ${error?.code || error?.message || "Unknown"}` };
  }
};
