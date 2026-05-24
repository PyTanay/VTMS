import { Router } from "express";
import { ApplicationStatus } from "@prisma/client";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import validationService from "../services/validation.service";
import numberingService from "../services/numbering.service";
import { canTransition, getValidTransitions, transitionApplication } from "../services/workflow.service";

export const applicationRouter = Router();
applicationRouter.use(authenticate);

const allowedApplicationFields = [
  "application_no",
  "applicant_type",
  "application_date",
  "status",
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
  "approved_from",
  "approved_to",
  "recommending_employee_id",
  "reference_details",
  "scrutiny_in_charge_id",
  "scrutiny_date",
  "scrutiny_remarks",
  "permission_letter_ref",
  "permission_letter_date",
  "posting_department_id",
  "joining_date",
  "gate_pass_no",
  "gate_pass_valid_up_to",
  "behavioral_rating",
  "progress_rating",
  "actual_completion_date",
  "report_submission_date",
  "certificate_ref",
  "certificate_issue_date",
  "no_due_ref",
];

const dateFields = new Set([
  "application_date",
  "college_letter_date",
  "requested_from",
  "requested_to",
  "approved_from",
  "approved_to",
  "scrutiny_date",
  "permission_letter_date",
  "joining_date",
  "gate_pass_valid_up_to",
  "actual_completion_date",
  "report_submission_date",
  "certificate_issue_date",
]);

const parseDateValue = (value: any) => {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return value;
};

const pickApplicationData = (body: any) => {
  const data: any = {};
  allowedApplicationFields.forEach((field) => {
    if (body[field] !== undefined) {
      data[field] = dateFields.has(field) ? parseDateValue(body[field]) : body[field];
    }
  });
  return data;
};

// Get dashboard statistics
applicationRouter.get("/stats", async (req, res, next) => {
  try {
    const totalApplications = await prisma.application.count();
    const activeTrainees = await prisma.application.count({
      where: {
        status: ApplicationStatus.TRAINING_ACTIVE,
      },
    });
    const totalDepartments = await prisma.department.count();

    res.json({
      success: true,
      data: {
        totalApplications,
        activeTrainees,
        totalDepartments,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get site visit statistics
applicationRouter.get("/site-stats", async (req, res, next) => {
  try {
    // Get total visits (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalVisits = await (prisma as any).siteVisit.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get unique visitors (distinct IP addresses in last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const uniqueVisitors = await (prisma as any).siteVisit.groupBy({
      by: ["ipAddress"],
      where: {
        createdAt: { gte: oneDayAgo },
        ipAddress: { not: null },
      },
    });

    // Get concurrent users (users who visited in last 5 minutes)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const concurrentUsers = await (prisma as any).siteVisit.groupBy({
      by: ["userId"],
      where: {
        createdAt: { gte: fiveMinutesAgo },
        userId: { not: null },
      },
    });

    res.json({
      success: true,
      data: {
        totalVisits,
        concurrentUsers: concurrentUsers.length,
        uniqueVisitorsToday: uniqueVisitors.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

applicationRouter.get("/", async (req, res, next) => {
  try {
    const { status, applicantType, collegeId, page = "1", perPage = "20", search, includeArchived } = req.query;
    const filters: any = {};

    if (status) filters.status = status;
    if (applicantType) filters.applicant_type = applicantType;
    if (collegeId) filters.collegeId = Number(collegeId);
    // By default, exclude archived applications unless includeArchived is true
    if (includeArchived !== "true") {
      filters.archived = false;
    }
    if (search) {
      filters.OR = [
        { student_name: { contains: String(search), mode: "insensitive" } },
        { student_father_name: { contains: String(search), mode: "insensitive" } },
        { student_email: { contains: String(search), mode: "insensitive" } },
        { application_no: { contains: String(search), mode: "insensitive" } },
      ];
    }

    // RBAC Scope Filtering
    const authReq = req as AuthRequest;
    if (authReq.user?.role === "RECOMMENDING_EMPLOYEE") {
      // Recommending employees can only see applications they created
      filters.recommending_employee_id = authReq.user.employeeId || undefined;
    }
    // TRAINING_CENTER_SECTION_HEAD (Department HOD): filter by their department
    if (authReq.user?.role === "TRAINING_CENTER_SECTION_HEAD" && authReq.user.employeeId) {
      const emp = await prisma.employee.findUnique({ where: { id: authReq.user.employeeId } });
      if (emp?.department) {
        // Filter by posting_department_id matching the HOD's department
        const dept = await prisma.department.findFirst({
          where: { department_name: { contains: emp.department, mode: "insensitive" } },
        });
        if (dept) {
          filters.posting_department_id = dept.id;
        }
      }
    }
    // TRAINING_IN_CHARGE: filter by applications assigned to them
    if (authReq.user?.role === "TRAINING_IN_CHARGE" && authReq.user.employeeId) {
      filters.scrutiny_in_charge_id = authReq.user.employeeId;
    }
    // ADMIN sees all (no filter)
    // ED_GM_APPROVER sees applications pending their approval

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(perPage), 1);

    const [applications, totalCount] = await Promise.all([
      prisma.application.findMany({
        where: filters,
        orderBy: { application_date: "desc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
        include: {
          category: true,
          branch: true,
          college: true,
          employee: true,
          department: true,
        },
      }),
      prisma.application.count({ where: filters }),
    ]);

    res.json({ success: true, data: applications, meta: { totalCount, page: pageNumber, perPage: pageSize } });
  } catch (error) {
    next(error);
  }
});

applicationRouter.get("/:id", async (req, res, next) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        category: true,
        branch: true,
        college: true,
        employee: true,
        department: true,
        document_verifications: true,
        biodata: {
          include: {
            academics: true,
            otherTrainings: true,
            sports: true,
            extracurriculars: true,
            familyMembers: true,
            gnfcRelatives: true,
            postings: true,
          },
        },
        certificates: true,
        noDueForm: {
          include: { lines: true },
        },
        postingLetterStudents: true,
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
});

applicationRouter.post("/", async (req: any, res, next) => {
  try {
    const validation = await validationService.validateApplicationSubmission(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: validation.errors });
    }

    const data = pickApplicationData(req.body);
    const authReq = req as AuthRequest;

    // Auto-set recommending_employee_id if user is a RECOMMENDING_EMPLOYEE
    if (authReq.user?.role === "RECOMMENDING_EMPLOYEE" && authReq.user.employeeId) {
      data.recommending_employee_id = authReq.user.employeeId;
    }

    if (!data.application_no) {
      data.application_no = await numberingService.generateApplicationNo();
    }

    const created = await prisma.application.create({ data });
    if (req.logAudit) {
      await req.logAudit("CREATE", "application", created.id, undefined, created);
    }

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

applicationRouter.put("/:id", async (req: any, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const data = pickApplicationData(req.body);
    const updated = await prisma.application.update({
      where: { id },
      data,
    });

    if (req.logAudit) {
      await req.logAudit("UPDATE", "application", id, existing, updated);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

applicationRouter.delete("/:id", async (req: any, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    await prisma.application.delete({ where: { id } });
    if (req.logAudit) {
      await req.logAudit("DELETE", "application", id, existing, undefined);
    }

    res.json({ success: true, message: "Application deleted" });
  } catch (error) {
    next(error);
  }
});

// Archive an application (soft delete - remains visible with archived tag)
applicationRouter.patch("/:id/archive", async (req: any, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { archived: true },
    });

    if (req.logAudit) {
      await req.logAudit("ARCHIVE", "application", id, existing, updated);
    }

    res.json({ success: true, data: updated, message: "Application archived" });
  } catch (error) {
    next(error);
  }
});

// Unarchive an application
applicationRouter.patch("/:id/unarchive", async (req: any, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { archived: false },
    });

    if (req.logAudit) {
      await req.logAudit("UNARCHIVE", "application", id, existing, updated);
    }

    res.json({ success: true, data: updated, message: "Application unarchived" });
  } catch (error) {
    next(error);
  }
});

applicationRouter.patch("/:id/status", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Use workflow engine to validate transition
    const result = await transitionApplication(id, existing.status, status, req.user!.id, req.user!.role);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, data: result.application });
  } catch (error) {
    next(error);
  }
});

applicationRouter.patch("/:id/scrutinize", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { scrutiny_in_charge_id, approved_from, approved_to, scrutiny_date, scrutiny_remarks, status } = req.body;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const toStatus = status || ApplicationStatus.SCRUTINIZED;

    // Use workflow engine to validate transition and log audit
    const result = await transitionApplication(id, existing.status, toStatus, req.user!.id, req.user!.role, {
      scrutiny_in_charge_id: scrutiny_in_charge_id ? Number(scrutiny_in_charge_id) : undefined,
      approved_from: approved_from ? new Date(approved_from) : undefined,
      approved_to: approved_to ? new Date(approved_to) : undefined,
      scrutiny_date: scrutiny_date ? new Date(scrutiny_date) : undefined,
      scrutiny_remarks,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, data: result.application });
  } catch (error: any) {
    console.error("Scrutiny error:", error);
    res.status(400).json({ success: false, message: `Scrutiny failed: ${error.message || "Unknown error"}` });
  }
});

/**
 * Safely convert a date string or Date to a proper Date object for Prisma.
 * Accepts "YYYY-MM-DD", "YYYY-MM-DDT00:00:00.000Z", or Date objects.
 */
const toDateOrUndefined = (val: any): Date | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  if (typeof val === "string" && val.trim()) {
    // If it's just "YYYY-MM-DD", append time to make it ISO-8601
    const trimmed = val.trim();
    const date = trimmed.includes("T") ? new Date(trimmed) : new Date(`${trimmed}T00:00:00.000Z`);
    if (!isNaN(date.getTime())) return date;
  }
  return undefined;
};

applicationRouter.patch("/:id/permission-letter", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { permission_letter_ref, permission_letter_date, posting_department_id, status } = req.body;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const toStatus = status || ApplicationStatus.PERMISSION_LETTER_SENT;

    const result = await transitionApplication(id, existing.status, toStatus, req.user!.id, req.user!.role, {
      permission_letter_ref,
      permission_letter_date: toDateOrUndefined(permission_letter_date),
      posting_department_id: posting_department_id ? Number(posting_department_id) : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, data: result.application });
  } catch (error: any) {
    console.error("Permission-letter error:", error);
    res.status(400).json({ success: false, message: `Failed: ${error.message || "Unknown error"}` });
  }
});

applicationRouter.patch("/:id/join", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { joining_date, gate_pass_no, gate_pass_valid_up_to, status } = req.body;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const toStatus = status || ApplicationStatus.JOINING_PENDING;

    const result = await transitionApplication(id, existing.status, toStatus, req.user!.id, req.user!.role, {
      joining_date: toDateOrUndefined(joining_date),
      gate_pass_no,
      gate_pass_valid_up_to: toDateOrUndefined(gate_pass_valid_up_to),
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.json({ success: true, data: result.application });
  } catch (error: any) {
    console.error("Join error:", error);
    res.status(400).json({ success: false, message: `Failed: ${error.message || "Unknown error"}` });
  }
});
