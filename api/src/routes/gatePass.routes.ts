import { Router } from "express";
import { authenticate } from "../middleware/auth";
import prisma from "../prisma";
import pdfService from "../services/pdf.service";

export const gatePassRouter = Router();
gatePassRouter.use(authenticate);

gatePassRouter.get("/", (_req, res) => {
  res.json({ success: true, data: [] });
});

// Generate gate pass PDF
gatePassRouter.post("/:id/generate", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const application = await prisma.application.findUnique({ where: { id }, include: { college: true } });
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });

    const pdf = await pdfService.generateGatePassPdf(application);
    res.json({ success: true, data: { pdfUrl: pdf.url } });
  } catch (error) {
    next(error);
  }
});
