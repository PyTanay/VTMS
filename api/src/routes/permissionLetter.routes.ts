import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";
import pdfService from "../services/pdf.service";
import numberingService from "../services/numbering.service";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { enqueue } from "../jobs/queue";

const permissionLetterNotificationTemplate = handlebars.compile(
  fs.readFileSync(path.join(__dirname, "..", "templates", "permission-letter-notification.hbs"), "utf-8"),
);

export const permissionLetterRouter = Router();
permissionLetterRouter.use(authenticate);

permissionLetterRouter.get("/", (_req, res) => {
  res.json({ success: true, data: [] });
});

// Generate a permission letter PDF for an application and save it to uploads
permissionLetterRouter.post(
  "/:id/generate",
  authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE", "EDUCATION_HEAD"]),
  async (req: AuthRequest, res, next) => {
    try {
      const id = Number(req.params.id);
      const application = await prisma.application.findUnique({ where: { id }, include: { college: true } });
      if (!application) return res.status(404).json({ success: false, message: "Application not found" });

      // simple ref generator
      const ref = await numberingService.generatePermissionLetterRef();
      const pdf = await pdfService.generatePermissionLetterPdf(application, { ref });

      // Check if there are any uploaded documents that need verification
      const docCount = await prisma.documentVerification.count({
        where: { applicationId: id },
      });

      // Auto-advance: if no documents exist, skip verification step
      const nextStatus = docCount === 0 ? "DOCUMENTS_VERIFIED" : "PERMISSION_LETTER_SENT";

      // update application with permission letter ref, date, and auto-advance status
      const updated = await prisma.application.update({
        where: { id },
        data: {
          permission_letter_ref: ref,
          permission_letter_date: new Date(),
          status: nextStatus,
        },
      });

      if (updated.student_email) {
        const subject = `Permission Letter issued: ${updated.application_no}`;
        const pdfUrl = `http://localhost:3000${pdf.url}`;
        const html = permissionLetterNotificationTemplate({
          studentName: updated.student_name,
          applicationNo: updated.application_no,
          permissionRef: ref,
          collegeName: application.college?.college_name || "-",
          issuedOn: new Date().toLocaleDateString(),
          pdfUrl,
        });
        enqueue("sendEmail", { to: updated.student_email, subject, html });
      }

      if (req.logAudit) {
        await req.logAudit("GENERATE", "permission_letter", updated.id, undefined, { permission_letter_ref: ref });
      }

      res.json({ success: true, data: { updated, pdfUrl: pdf.url } });
    } catch (error) {
      next(error);
    }
  },
);
