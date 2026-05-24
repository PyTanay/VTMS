import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { authRouter } from "./routes/auth.routes";
import { masterRouter } from "./routes/master.routes";
import { applicationRouter } from "./routes/application.routes";
import { scrutinyRouter } from "./routes/scrutiny.routes";
import { permissionLetterRouter } from "./routes/permissionLetter.routes";
import { documentVerificationRouter } from "./routes/documentVerification.routes";
import { biodataRouter } from "./routes/biodata.routes";
import { gatePassRouter } from "./routes/gatePass.routes";
import { postingRouter } from "./routes/posting.routes";
import { certificateRouter } from "./routes/certificate.routes";
import { noDueRouter } from "./routes/noDue.routes";
import { rolesRouter } from "./routes/roles.routes";
import { emailConfigRouter } from "./routes/emailConfig.routes";
import { reportRouter } from "./routes/report.routes";
import { employeeRouter } from "./routes/employee.routes";
import { userRouter } from "./routes/user.routes";
import { samvadRouter } from "./routes/samvad.routes";
import { uploadRouter } from "./routes/upload.routes";
import { auditLogRouter } from "./routes/auditLog.routes";
import { commentRouter } from "./routes/comment.routes";
import { timelineRouter } from "./routes/timeline.routes";
import { publicRouter } from "./routes/public.routes";
import { errorHandler } from "./middleware/errorHandler";
import auditLoggingMiddleware from "./middleware/auditLog";
import { siteVisitMiddleware } from "./middleware/siteVisit";
import { scheduleSamvadSync } from "./jobs/samvadSync";
import { scheduleCleanup } from "./jobs/cleanupUploads";
import { scheduleReminders } from "./jobs/reminder";
import { startQueue } from "./jobs/queue";

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3001")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
["http://localhost:5173", "http://localhost:5174"].forEach((origin) => {
  if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin);
});
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(auditLoggingMiddleware);
app.use(siteVisitMiddleware);
app.use(
  "/uploads",
  express.static("uploads", {
    setHeaders: (res, path) => {
      if (path.endsWith(".pdf")) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
      }
    },
  }),
);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/masters", masterRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/scrutiny", scrutinyRouter);
app.use("/api/permission-letters", permissionLetterRouter);
app.use("/api/document-verification", documentVerificationRouter);
app.use("/api/biodata", biodataRouter);
app.use("/api/gate-pass", gatePassRouter);
app.use("/api/postings", postingRouter);
app.use("/api/certificates", certificateRouter);
app.use("/api/no-dues", noDueRouter);
app.use("/api/reports", reportRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/users", userRouter);
app.use("/api/samvad", samvadRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/email-config", emailConfigRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api/audit-logs", auditLogRouter);
app.use("/api/public", publicRouter);
app.use("/api", commentRouter);
app.use("/api", timelineRouter);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`⚡ VTMS API running on http://localhost:${PORT}`);
    scheduleSamvadSync(); // start nightly SAMVAD sync cron
    scheduleReminders(); // start daily reminder email cron
    scheduleCleanup();
    startQueue();
  });
}

export default app;
