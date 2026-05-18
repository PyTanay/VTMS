import { Router } from "express";
import { ApplicationStatus } from "@prisma/client";
import prisma from "../prisma";
import { authenticate } from "../middleware/auth";

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

applicationRouter.get("/", async (req, res, next) => {
  try {
    const { status, applicantType, collegeId, page = "1", perPage = "20", search } = req.query;
    const filters: any = {};

    if (status) filters.status = status;
    if (applicantType) filters.applicant_type = applicantType;
    if (collegeId) filters.collegeId = Number(collegeId);
    if (search) {
      filters.OR = [
        { student_name: { contains: String(search), mode: "insensitive" } },
        { student_father_name: { contains: String(search), mode: "insensitive" } },
        { student_email: { contains: String(search), mode: "insensitive" } },
        { application_no: { contains: String(search), mode: "insensitive" } },
      ];
    }

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
          recommending_employee: true,
          posting_department: true,
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
        recommending_employee: true,
        posting_department: true,
        verifications: true,
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

applicationRouter.post("/", async (req, res, next) => {
  try {
    const data = pickApplicationData(req.body);
    const created = await prisma.application.create({ data });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

applicationRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = pickApplicationData(req.body);

    const updated = await prisma.application.update({
      where: { id },
      data,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

applicationRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.application.delete({ where: { id } });
    res.json({ success: true, message: "Application deleted" });
  } catch (error) {
    next(error);
  }
});

applicationRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

applicationRouter.patch("/:id/scrutinize", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { scrutiny_in_charge_id, approved_from, approved_to, scrutiny_date, scrutiny_remarks, status } = req.body;
    const data: any = {};

    if (scrutiny_in_charge_id !== undefined) data.scrutiny_in_charge_id = scrutiny_in_charge_id;
    if (approved_from !== undefined) data.approved_from = approved_from;
    if (approved_to !== undefined) data.approved_to = approved_to;
    if (scrutiny_date !== undefined) data.scrutiny_date = scrutiny_date;
    if (scrutiny_remarks !== undefined) data.scrutiny_remarks = scrutiny_remarks;
    data.status = status || ApplicationStatus.SCRUTINIZED;

    const updated = await prisma.application.update({ where: { id }, data });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

applicationRouter.patch("/:id/permission-letter", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { permission_letter_ref, permission_letter_date, posting_department_id, status } = req.body;
    const data: any = {};

    if (permission_letter_ref !== undefined) data.permission_letter_ref = permission_letter_ref;
    if (permission_letter_date !== undefined) data.permission_letter_date = permission_letter_date;
    if (posting_department_id !== undefined) data.posting_department_id = posting_department_id;
    data.status = status || ApplicationStatus.PERMISSION_LETTER_SENT;

    const updated = await prisma.application.update({ where: { id }, data });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

applicationRouter.patch("/:id/join", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { joining_date, gate_pass_no, gate_pass_valid_up_to, status } = req.body;
    const data: any = {};

    if (joining_date !== undefined) data.joining_date = joining_date;
    if (gate_pass_no !== undefined) data.gate_pass_no = gate_pass_no;
    if (gate_pass_valid_up_to !== undefined) data.gate_pass_valid_up_to = gate_pass_valid_up_to;
    data.status = status || ApplicationStatus.JOINING_PENDING;

    const updated = await prisma.application.update({ where: { id }, data });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});
