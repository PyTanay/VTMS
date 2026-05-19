import { Router } from "express";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const documentVerificationRouter = Router();
documentVerificationRouter.use(authenticate);

// GET / — List all document verifications with search/filter
documentVerificationRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const { search, verified, doc_type, applicationId, page = "1", perPage = "50" } = req.query as any;
    const where: any = {};

    if (applicationId) where.applicationId = Number(applicationId);
    if (verified === "true") where.verified = true;
    if (verified === "false") where.verified = false;
    if (doc_type) where.doc_type = { contains: doc_type, mode: "insensitive" };
    if (search) {
      where.OR = [{ doc_type: { contains: search, mode: "insensitive" } }, { remarks: { contains: search, mode: "insensitive" } }];
    }

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(perPage), 1);

    const [items, total] = await Promise.all([
      prisma.documentVerification.findMany({
        where,
        include: {
          application: { select: { id: true, application_no: true, student_name: true, student_surname: true } },
          verified_by: { select: { id: true, username: true } },
        },
        orderBy: { id: "desc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.documentVerification.count({ where }),
    ]);

    res.json({ success: true, data: items, total, page: pageNumber, perPage: pageSize });
  } catch (error) {
    next(error);
  }
});

// Create a document verification record
documentVerificationRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { applicationId, doc_type, file_path } = req.body;
    if (!applicationId || !file_path)
      return res.status(400).json({ success: false, message: "applicationId and file_path are required" });

    const created = await prisma.documentVerification.create({
      data: { applicationId: Number(applicationId), doc_type: doc_type || "document", file_path },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// List verifications for an application
documentVerificationRouter.get("/application/:applicationId", async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const items = await prisma.documentVerification.findMany({
      where: { applicationId },
      include: {
        application: { select: { id: true, application_no: true, student_name: true } },
        verified_by: { select: { id: true, username: true } },
      },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

// GET /doc-types — list distinct document types for filter dropdown
documentVerificationRouter.get("/doc-types", async (_req, res, next) => {
  try {
    const result = await prisma.documentVerification.findMany({
      select: { doc_type: true },
      distinct: ["doc_type"],
      orderBy: { doc_type: "asc" },
    });
    res.json({ success: true, data: result.map((r) => r.doc_type) });
  } catch (error) {
    next(error);
  }
});

// Mark a document as verified
documentVerificationRouter.patch("/:id/verify", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const verifiedBy = req.user?.id;
    const updated = await prisma.documentVerification.update({
      where: { id },
      data: { verified: true, verified_by_id: verifiedBy, verified_at: new Date(), remarks: req.body.remarks || undefined },
      include: {
        application: { select: { id: true, application_no: true, student_name: true, status: true } },
        verified_by: { select: { id: true, username: true } },
      },
    });

    // Auto-update application status if all documents verified
    const allDocs = await prisma.documentVerification.findMany({
      where: { applicationId: updated.applicationId },
    });
    const allVerified = allDocs.length > 0 && allDocs.every((d) => d.verified);
    if (allVerified) {
      await prisma.application.update({
        where: { id: updated.applicationId },
        data: { status: "DOCUMENTS_VERIFIED" },
      });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});
