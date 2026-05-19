import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";
import pdfService from "../services/pdf.service";
import numberingService from "../services/numbering.service";

export const certificateRouter = Router();
certificateRouter.use(authenticate);

certificateRouter.get("/", async (_req, res, next) => {
  try {
    const certs = await prisma.certificate.findMany({ include: { application: true } });
    res.json({ success: true, data: certs });
  } catch (error) {
    next(error);
  }
});

// Get certificates for an application
certificateRouter.get("/application/:applicationId", async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const certs = await prisma.certificate.findMany({ where: { applicationId } });
    res.json({ success: true, data: certs });
  } catch (error) {
    next(error);
  }
});

// Create a certificate
certificateRouter.post(
  "/",
  authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"]),
  async (req: AuthRequest, res, next) => {
    try {
      const { applicationId, behavioral_rating, progress_rating, actual_completion_date, report_submission_date } = req.body;
      if (!applicationId) return res.status(400).json({ success: false, message: "applicationId is required" });

      const ref = await numberingService.generateCertificateRef();
      const cert = await prisma.certificate.create({
        data: {
          applicationId: Number(applicationId),
          certificate_ref: ref,
          behavioral_rating,
          progress_rating,
          actual_completion_date: actual_completion_date ? new Date(actual_completion_date) : new Date(),
          report_submission_date: report_submission_date ? new Date(report_submission_date) : new Date(),
        },
      });

      if (req.logAudit) {
        await req.logAudit("CREATE", "certificate", cert.id, undefined, cert);
      }

      res.status(201).json({ success: true, data: cert });
    } catch (error) {
      next(error);
    }
  },
);

// Approve a duplicate certificate
certificateRouter.patch(
  "/:id/approve-duplicate",
  authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD"]),
  async (req: AuthRequest, res, next) => {
    try {
      const id = Number(req.params.id);
      const { duplicate_approved_by, duplicate_reason } = req.body;

      const updated = await prisma.certificate.update({
        where: { id },
        data: { is_duplicate: true, duplicate_approved_by, duplicate_reason },
      });

      if (req.logAudit) {
        await req.logAudit("APPROVE_DUPLICATE", "certificate", id, undefined, updated);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);

// Generate certificate PDF
certificateRouter.post(
  "/:id/generate",
  authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"]),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const cert = await prisma.certificate.findUnique({ where: { id }, include: { application: true } });
      if (!cert) return res.status(404).json({ success: false, message: "Certificate not found" });

      const pdf = await pdfService.generateCertificatePdf(cert.application, cert);
      res.json({ success: true, data: { pdfUrl: pdf.url } });
    } catch (error) {
      next(error);
    }
  },
);

// Issue certificate (mark as issued)
certificateRouter.patch("/:id/issue", authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return res.status(404).json({ success: false, message: "Certificate not found" });
    if (cert.issued_at) return res.status(400).json({ success: false, message: "Certificate already issued" });

    const updated = await prisma.certificate.update({
      where: { id },
      data: { issued_at: new Date() },
    });

    if (req.logAudit) {
      await req.logAudit("ISSUE", "certificate", id, undefined, updated);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});
