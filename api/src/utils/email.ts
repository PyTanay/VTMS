import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

// ── Config with validation & fallback ──
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_SECURE = process.env.SMTP_SECURE === "true";
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || "noreply@gnfc.in";

// ── Lazy transporter creation (so we don't fail on startup if SMTP is down) ──
let transporter: nodemailer.Transporter | null = null;
let emailConfigured = false;

const getTransporter = (): nodemailer.Transporter | null => {
  if (transporter) return transporter;
  if (!SMTP_HOST) {
    console.warn("[EMAIL] SMTP_HOST not configured. Email sending is disabled.");
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
    console.warn(`[EMAIL] Template not found: ${filePath}`);
    return (data: any) => `<p>${JSON.stringify(data)}</p>`;
  }
  const source = fs.readFileSync(filePath, "utf-8");
  return handlebars.compile(source);
};

const approvalTemplate = compileTemplate("approval-request");
const permissionLetterTemplate = compileTemplate("permission-letter-notification");
const noDueClearanceTemplate = compileTemplate("no-due-clearance");

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  const t = getTransporter();
  if (!t) {
    console.log(`[EMAIL] Skipping send to ${to} (SMTP not configured). Subject: ${subject}`);
    return false;
  }
  try {
    const info = await t.sendMail({
      from: `"VTMS Portal" <${SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[EMAIL] Error sending to ${to}:`, error?.code || error?.message || error);
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
  return sendEmail(to, `Permission Letter Issued — ${applicationNo}`, html);
};

export const sendNoDueClearanceNotification = async (to: string, studentName: string, applicationNo: string, noDueRef: string) => {
  const html = noDueClearanceTemplate({
    studentName,
    applicationNo,
    noDueRef,
    completedOn: new Date().toLocaleDateString(),
  });
  return sendEmail(to, `No Due Clearance Completed — ${applicationNo}`, html);
};

export const testEmailConnection = async (): Promise<{ ok: boolean; message: string }> => {
  const t = getTransporter();
  if (!t) return { ok: false, message: "SMTP not configured" };
  try {
    await t.verify();
    return { ok: true, message: "SMTP connection verified" };
  } catch (error: any) {
    return { ok: false, message: `SMTP error: ${error?.code || error?.message || "Unknown"}` };
  }
};
