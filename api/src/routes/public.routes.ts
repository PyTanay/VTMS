import { Router } from "express";
import prisma from "../prisma";
import numberingService from "../services/numbering.service";
import validationService from "../services/validation.service";

export const publicRouter = Router();

// ─── GET: Master data for dropdowns (no auth) ───
publicRouter.get("/masters", async (_req, res, next) => {
  try {
    const [categories, branches, colleges, departments] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.branch.findMany({ orderBy: { branch_name: "asc" } }),
      prisma.college.findMany({ orderBy: { college_name: "asc" } }),
      prisma.department.findMany({ orderBy: { department_name: "asc" } }),
    ]);
    res.json({
      success: true,
      data: { categories, branches, colleges, departments },
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST: Submit new application (no auth) ───
publicRouter.post("/applications", async (req, res, next) => {
  try {
    const validation = await validationService.validateApplicationSubmission(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const body = req.body;
    const allowedFields = [
      "applicant_type",
      "student_surname",
      "student_name",
      "student_father_name",
      "son_daughter",
      "relation",
      "student_email",
      "student_mobile",
      "presently_pursuing",
      "training_compulsory",
      "part_of_curriculum",
      "full_time_course",
      "past_training",
      "categoryId",
      "branchId",
      "year_of_study",
      "semester",
      "collegeId",
      "college_pincode",
      "college_website",
      "college_hod_name",
      "college_hod_email",
      "college_letter_ref",
      "college_letter_date",
      "requested_from",
      "requested_to",
    ];

    const dateFields = new Set(["college_letter_date", "requested_from", "requested_to"]);
    const data: any = { status: "DRAFT" };

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== null && body[field] !== "") {
        data[field] = dateFields.has(field) ? new Date(body[field]) : body[field];
      }
    }

    // Generate application number
    data.application_no = await numberingService.generateApplicationNo();
    data.application_date = new Date();

    const created = await prisma.application.create({ data });

    res.status(201).json({
      success: true,
      data: {
        id: created.id,
        application_no: created.application_no,
        student_name: created.student_name,
        status: created.status,
        message: "Application submitted successfully",
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET: Track application by application_no OR email ───
publicRouter.get("/applications/track", async (req, res, next) => {
  try {
    const { application_no, email } = req.query;

    if (!application_no && !email) {
      return res.status(400).json({
        success: false,
        message: "Provide application_no or email to track",
      });
    }

    const where: any = {};
    if (application_no) where.application_no = String(application_no);
    if (email) where.student_email = String(email);

    const applications = await prisma.application.findMany({
      where,
      orderBy: { application_date: "desc" },
      select: {
        id: true,
        application_no: true,
        student_name: true,
        student_surname: true,
        status: true,
        application_date: true,
        requested_from: true,
        requested_to: true,
        approved_from: true,
        approved_to: true,
        categoryId: true,
        branchId: true,
        collegeId: true,
        posting_department_id: true,
        permission_letter_ref: true,
        gate_pass_no: true,
        certificate_ref: true,
        no_due_ref: true,
        behavioral_rating: true,
        progress_rating: true,
        category: { select: { name: true } },
        branch: { select: { branch_name: true } },
        college: { select: { college_name: true, place: true } },
        posting_department: { select: { department_name: true } },
      },
    });

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No applications found matching your search",
      });
    }

    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
});

// ─── GET: Application detail by application_no (public) ───
publicRouter.get("/applications/:applicationNo", async (req, res, next) => {
  try {
    const app = await prisma.application.findUnique({
      where: { application_no: String(req.params.applicationNo) },
      select: {
        id: true,
        application_no: true,
        student_surname: true,
        student_name: true,
        status: true,
        application_date: true,
        requested_from: true,
        requested_to: true,
        approved_from: true,
        approved_to: true,
        permission_letter_ref: true,
        gate_pass_no: true,
        joining_date: true,
        actual_completion_date: true,
        certificate_ref: true,
        no_due_ref: true,
        behavioral_rating: true,
        progress_rating: true,
        category: { select: { name: true } },
        branch: { select: { branch_name: true } },
        college: { select: { college_name: true, place: true } },
        posting_department: { select: { department_name: true } },
      },
    });

    if (!app) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, data: app });
  } catch (error) {
    next(error);
  }
});
