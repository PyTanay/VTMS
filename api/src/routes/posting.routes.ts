import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";
import { generatePostingLetterPdf } from "../services/pdf.service";

export const postingRouter = Router();
postingRouter.use(authenticate);

postingRouter.get("/", async (_req, res, next) => {
  try {
    const letters = await prisma.postingLetter.findMany({ include: { posting_letter_students: { include: { application: true } } } });
    res.json({ success: true, data: letters });
  } catch (error) {
    next(error);
  }
});

// Create a posting letter for a group of trainees
postingRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const {
      posting_department,
      to_report_to,
      reporting_officer_email,
      selected_weekdays,
      training_in_charge,
      department_head,
      applicationIds,
    } = req.body;

    if (!posting_department || !applicationIds || applicationIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields: posting_department and applicationIds are required" });
    }

    const refNo = `POSTING-${new Date().getFullYear()}-${Date.now()}`;
    const letter = await prisma.postingLetter.create({
      data: {
        ref_no: refNo,
        qualification_branch: "",
        college_short_name: "",
        college_place: "",
        posting_department,
        to_report_to: to_report_to || "N/A",
        reporting_officer_email: reporting_officer_email || "",
        selected_weekdays: selected_weekdays || "Monday,Tuesday,Wednesday,Thursday,Friday",
        training_in_charge: training_in_charge || "N/A",
        department_head: department_head || "N/A",
        posting_letter_students: {
          create: applicationIds.map((appId: number) => ({ applicationId: appId })),
        },
      },
      include: { posting_letter_students: true },
    });

    res.status(201).json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// Get posting letter details with students
postingRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const letter = await prisma.postingLetter.findUnique({
      where: { id },
      include: { posting_letter_students: { include: { application: true } } },
    });
    if (!letter) return res.status(404).json({ success: false, message: "Posting letter not found" });
    res.json({ success: true, data: letter });
  } catch (error) {
    next(error);
  }
});

// Generate PDF for a posting letter
postingRouter.post(
  "/:id/generate",
  authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"]),
  async (req: AuthRequest, res, next) => {
    try {
      const id = Number(req.params.id);
      const letter = await prisma.postingLetter.findUnique({
        where: { id },
        include: { posting_letter_students: { include: { application: { include: { college: true } } } } },
      });
      if (!letter) return res.status(404).json({ success: false, message: "Posting letter not found" });

      const pdf = await generatePostingLetterPdf(letter);

      if (req.logAudit) {
        await req.logAudit("GENERATE_PDF", "posting_letter", id, undefined, { ref_no: letter.ref_no, pdfUrl: pdf.url });
      }

      res.json({ success: true, data: { pdfUrl: pdf.url, filename: pdf.filename } });
    } catch (error) {
      next(error);
    }
  },
);
