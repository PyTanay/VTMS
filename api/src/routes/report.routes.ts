import { Router } from "express";
import { authenticate } from "../middleware/auth";
import prisma from "../prisma";

export const reportRouter = Router();
reportRouter.use(authenticate);

// ─── Helper: parse from/to query params ───
const dateFilter = (from?: string, to?: string): { gte?: Date; lte?: Date } => {
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return filter;
};

// ─── Helper: CSV escape ───
const csvCell = (val: any): string => {
  const str = val == null ? "" : String(val);
  return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
};

const asCsv = (rows: Record<string, any>[], columns: string[]): string => {
  const header = columns.map(csvCell).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(","));
  return [header, ...body].join("\n");
};

const sendResponse = (res: any, rows: Record<string, any>[], columns: string[], label: string) => {
  const format = (res.req as any).query.format;
  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${label.replace(/\s+/g, "_")}.csv"`);
    return res.send(asCsv(rows, columns));
  }
  res.json({ success: true, data: rows, total: rows.length });
};

// ─── Report index ───
reportRouter.get("/", async (_req, res) => {
  res.json({
    success: true,
    data: [
      { name: "application-register", label: "Application Register" },
      { name: "approved", label: "Approved Applications" },
      { name: "permissions", label: "Permissions Given" },
      { name: "branch-wise", label: "Branch Wise" },
      { name: "college-wise", label: "College Wise" },
      { name: "training-completed", label: "Training Completed" },
      { name: "incharge-wise", label: "In-Charge Wise" },
      { name: "college-wise-apps", label: "College Wise Applications" },
      { name: "dept-posting", label: "Department Wise Posting" },
      { name: "recommended-by", label: "Recommended by Employee" },
      { name: "other-references", label: "Other References" },
      { name: "employee-children", label: "Employee's Son/Daughter" },
      { name: "training-during-fy", label: "Training During Financial Year" },
    ],
  });
});

// ─── 1. Application Register ───
reportRouter.get("/application-register", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: { application_date: { ...dateFilter(from, to) } },
      include: { category: true, branch: true, college: true },
      orderBy: { application_date: "desc" },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      Category: a.category?.name ?? "",
      Branch: a.branch?.branch_name ?? "",
      College: a.college?.college_name ?? "",
      Status: a.status,
      "Applied On": a.application_date.toISOString().split("T")[0],
    }));
    sendResponse(
      res,
      rows,
      ["App No", "Student Name", "Category", "Branch", "College", "Status", "Applied On"],
      "application_register",
    );
  } catch (error) {
    next(error);
  }
});

// ─── 2. Approved Applications ───
reportRouter.get("/approved", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        status: { in: ["APPROVED", "RECEIVED_BY_TC", "SCRUTINIZED", "PERMISSION_LETTER_SENT"] },
        application_date: { ...dateFilter(from, to) },
      },
      include: { category: true, college: true },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      Category: a.category?.name ?? "",
      College: a.college?.college_name ?? "",
      Status: a.status,
      "Applied On": a.application_date.toISOString().split("T")[0],
    }));
    sendResponse(res, rows, ["App No", "Student Name", "Category", "College", "Status", "Applied On"], "approved_applications");
  } catch (error) {
    next(error);
  }
});

// ─── 3. Permissions Given ───
reportRouter.get("/permissions", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        permission_letter_ref: { not: null },
        permission_letter_date: { ...dateFilter(from, to) },
      },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      "Permission Ref": a.permission_letter_ref ?? "",
      "Letter Date": a.permission_letter_date ? a.permission_letter_date.toISOString().split("T")[0] : "",
    }));
    sendResponse(res, rows, ["App No", "Student Name", "Permission Ref", "Letter Date"], "permissions_given");
  } catch (error) {
    next(error);
  }
});

// ─── 4. Branch Wise ───
reportRouter.get("/branch-wise", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const branches = await prisma.branch.findMany();
    const report = await Promise.all(
      branches.map(async (b) => ({
        Branch: b.branch_name,
        Count: await prisma.application.count({
          where: { branchId: b.id, application_date: { ...dateFilter(from, to) } },
        }),
      })),
    );
    sendResponse(res, report, ["Branch", "Count"], "branch_wise");
  } catch (error) {
    next(error);
  }
});

// ─── 5. College Wise ───
reportRouter.get("/college-wise", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const colleges = await prisma.college.findMany();
    const report = await Promise.all(
      colleges.map(async (c) => ({
        College: c.college_name,
        Count: await prisma.application.count({
          where: { collegeId: c.id, application_date: { ...dateFilter(from, to) } },
        }),
      })),
    );
    sendResponse(res, report, ["College", "Count"], "college_wise");
  } catch (error) {
    next(error);
  }
});

// ─── 6. Training Completed ───
reportRouter.get("/training-completed", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        status: "TRAINING_COMPLETED",
        actual_completion_date: { ...dateFilter(from, to) },
      },
      include: { category: true },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      Category: a.category?.name ?? "",
      "Completed On": a.actual_completion_date ? a.actual_completion_date.toISOString().split("T")[0] : "",
    }));
    sendResponse(res, rows, ["App No", "Student Name", "Category", "Completed On"], "training_completed");
  } catch (error) {
    next(error);
  }
});

// ══════════════════════════════════════════
//  NEW REPORTS (7-12)
// ══════════════════════════════════════════

// ─── 7. In-Charge Wise ───
reportRouter.get("/incharge-wise", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        scrutiny_in_charge_id: { not: null },
        scrutiny_date: { ...dateFilter(from, to) },
      },
    });
    const rows = apps.map((a) => ({
      "In-Charge ID": a.scrutiny_in_charge_id ?? "",
      "App No": a.application_no,
      "Student Name": a.student_name,
      "Scrutiny Date": a.scrutiny_date ? a.scrutiny_date.toISOString().split("T")[0] : "",
      Remarks: a.scrutiny_remarks ?? "",
    }));
    sendResponse(res, rows, ["In-Charge ID", "App No", "Student Name", "Scrutiny Date", "Remarks"], "incharge_wise");
  } catch (error) {
    next(error);
  }
});

// ─── 8. College Wise Applications ───
reportRouter.get("/college-wise-apps", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const colleges = await prisma.college.findMany();
    const report = await Promise.all(
      colleges.map(async (c) => {
        const apps = await prisma.application.findMany({
          where: { collegeId: c.id, application_date: { ...dateFilter(from, to) } },
          select: { application_no: true, student_name: true, status: true, application_date: true },
        });
        return {
          College: c.college_name,
          "Total Apps": apps.length,
          Students: apps.map((a) => `${a.application_no} (${a.student_name})`).join("; "),
        };
      }),
    );
    sendResponse(res, report, ["College", "Total Apps", "Students"], "college_wise_applications");
  } catch (error) {
    next(error);
  }
});

// ─── 9. Department Wise Posting ───
reportRouter.get("/dept-posting", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const depts = await prisma.department.findMany();
    const report = await Promise.all(
      depts.map(async (d) => ({
        Department: d.department_name,
        Count: await prisma.application.count({
          where: {
            posting_department_id: d.id,
            posting_department: { is: { id: d.id } },
            ...(from || to ? { application_date: { ...dateFilter(from, to) } } : {}),
          },
        }),
      })),
    );
    sendResponse(res, report, ["Department", "Count"], "dept_posting");
  } catch (error) {
    next(error);
  }
});

// ─── 10. Recommended by Employee ───
reportRouter.get("/recommended-by", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        recommending_employee_id: { not: null },
        application_date: { ...dateFilter(from, to) },
      },
      include: { recommending_employee: true },
    });
    const rows = apps.map((a) => ({
      Employee: a.recommending_employee?.name ?? "Unknown",
      "Emp No": a.recommending_employee?.employee_no ?? "",
      "App No": a.application_no,
      "Student Name": a.student_name,
      Status: a.status,
    }));
    sendResponse(res, rows, ["Employee", "Emp No", "App No", "Student Name", "Status"], "recommended_by_employee");
  } catch (error) {
    next(error);
  }
});

// ─── 11. Other References ───
reportRouter.get("/other-references", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        applicant_type: "OTHER_REFERENCE",
        application_date: { ...dateFilter(from, to) },
      },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      "Reference Details": a.reference_details ?? "",
      Status: a.status,
    }));
    sendResponse(res, rows, ["App No", "Student Name", "Reference Details", "Status"], "other_references");
  } catch (error) {
    next(error);
  }
});

// ─── 12. Employee's Son/Daughter ───
reportRouter.get("/employee-children", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        son_daughter: true,
        application_date: { ...dateFilter(from, to) },
      },
      include: { recommending_employee: true },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      "Father Name": a.student_father_name,
      "Recommending Emp": a.recommending_employee?.name ?? "",
      Status: a.status,
    }));
    sendResponse(res, rows, ["App No", "Student Name", "Father Name", "Recommending Emp", "Status"], "employee_children");
  } catch (error) {
    next(error);
  }
});

// ─── 13. Training During Financial Year ───
reportRouter.get("/training-during-fy", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const apps = await prisma.application.findMany({
      where: {
        status: {
          in: ["TRAINING_ACTIVE", "TRAINING_COMPLETED", "NO_DUES_PENDING", "CERTIFICATE_READY", "CERTIFICATE_ISSUED", "CLOSED"],
        },
        ...(from || to ? { application_date: { ...dateFilter(from, to) } } : {}),
      },
      include: { category: true, branch: true },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      Category: a.category?.name ?? "",
      Branch: a.branch?.branch_name ?? "",
      "Training From": a.approved_from ? a.approved_from.toISOString().split("T")[0] : "",
      "Training To": a.approved_to ? a.approved_to.toISOString().split("T")[0] : "",
      Status: a.status,
    }));
    sendResponse(
      res,
      rows,
      ["App No", "Student Name", "Category", "Branch", "Training From", "Training To", "Status"],
      "training_during_fy",
    );
  } catch (error) {
    next(error);
  }
});
