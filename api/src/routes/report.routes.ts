import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";

export const reportRouter = Router();
reportRouter.use(authenticate);

// â”€â”€â”€ Helper: parse from/to query params â”€â”€â”€
const dateFilter = (from?: string, to?: string): { gte?: Date; lte?: Date } => {
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return filter;
};

// â”€â”€â”€ Helper: Get department filter for HOD, Training In-Charge, and Recommending Employee â”€â”€â”€
const getHodDepartmentFilter = async (req: AuthRequest) => {
  const filter: any = {};

  // TRAINING_CENTER_SECTION_HEAD (HOD): filter by their department
  if (req.user?.role === "TRAINING_CENTER_SECTION_HEAD" && req.user.employeeId) {
    const emp = await prisma.employee.findUnique({ where: { id: req.user.employeeId } });
    if (emp?.department) {
      const dept = await prisma.department.findFirst({
        where: { department_name: { contains: emp.department, mode: "insensitive" } },
      });
      if (dept) {
        filter.posting_department_id = dept.id;
      }
    }
  }
  // TRAINING_IN_CHARGE: filter by applications assigned to them
  else if (req.user?.role === "TRAINING_IN_CHARGE" && req.user.employeeId) {
    filter.scrutiny_in_charge_id = req.user.employeeId;
  }
  // employee: filter by applications they created
  else if (req.user?.role === "employee" && req.user.employeeId) {
    filter.employee_id = req.user.employeeId;
  }

  return filter;
};

// â”€â”€â”€ Helper: CSV escape â”€â”€â”€
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
  // Filter out rows where ALL numeric/count values are 0 or empty
  const filteredRows = rows.filter((row) => {
    const values = Object.values(row);
    // Keep row if at least one value is non-zero and non-empty
    return values.some((v) => {
      if (v === undefined || v === null || v === "") return false;
      if (typeof v === "number") return v !== 0;
      if (typeof v === "string" && !isNaN(Number(v))) return Number(v) !== 0;
      return true; // non-numeric, non-empty values are meaningful
    });
  });
  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${label.replace(/\s+/g, "_")}.csv"`);
    return res.send(asCsv(filteredRows, columns));
  }
  res.json({ success: true, data: filteredRows, total: filteredRows.length });
};

// â”€â”€â”€ Report index â”€â”€â”€
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

// â”€â”€â”€ 1. Application Register â”€â”€â”€
reportRouter.get("/application-register", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        application_date: { ...dateFilter(from, to) },
        ...hodFilter,
      },
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

// â”€â”€â”€ 2. Approved Applications â”€â”€â”€
reportRouter.get("/approved", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        status: { in: ["APPROVED", "RECEIVED_BY_TC", "SCRUTINIZED", "PERMISSION_LETTER_SENT"] },
        application_date: { ...dateFilter(from, to) },
        ...hodFilter,
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

// â”€â”€â”€ 3. Permissions Given â”€â”€â”€
reportRouter.get("/permissions", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        permission_letter_ref: { not: null },
        permission_letter_date: { ...dateFilter(from, to) },
        ...hodFilter,
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

// â”€â”€â”€ 4. Branch Wise â”€â”€â”€
reportRouter.get("/branch-wise", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    // Only fetch branches that have at least one application in the date range
    const branches = await prisma.branch.findMany({
      where: {
        applications: {
          some: {
            application_date: { ...dateFilter(from, to) },
            ...hodFilter,
          },
        },
      },
    });
    const report = await Promise.all(
      branches.map(async (b) => ({
        Branch: b.branch_name,
        Count: await prisma.application.count({
          where: { branchId: b.id, application_date: { ...dateFilter(from, to) }, ...hodFilter },
        }),
      })),
    );
    sendResponse(res, report, ["Branch", "Count"], "branch_wise");
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ 5. College Wise â”€â”€â”€
reportRouter.get("/college-wise", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    // Only fetch colleges that have at least one application in the date range
    const collegesWithApps = await prisma.college.findMany({
      where: {
        applications: {
          some: {
            application_date: { ...dateFilter(from, to) },
            ...hodFilter,
          },
        },
      },
    });
    const report = await Promise.all(
      collegesWithApps.map(async (c) => ({
        College: c.college_name,
        Count: await prisma.application.count({
          where: { collegeId: c.id, application_date: { ...dateFilter(from, to) }, ...hodFilter },
        }),
      })),
    );
    sendResponse(res, report, ["College", "Count"], "college_wise");
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ 6. Training Completed â”€â”€â”€
reportRouter.get("/training-completed", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        status: "TRAINING_COMPLETED",
        actual_completion_date: { ...dateFilter(from, to) },
        ...hodFilter,
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  NEW REPORTS (7-12)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€ 7. In-Charge Wise â”€â”€â”€
reportRouter.get("/incharge-wise", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        scrutiny_in_charge_id: { not: null },
        scrutiny_date: { ...dateFilter(from, to) },
        ...hodFilter,
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

// â”€â”€â”€ 8. College Wise Applications â”€â”€â”€
reportRouter.get("/college-wise-apps", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    // Only fetch colleges that have at least one application in the date range
    const collegesWithApps = await prisma.college.findMany({
      where: {
        applications: {
          some: {
            application_date: { ...dateFilter(from, to) },
            ...hodFilter,
          },
        },
      },
    });
    const report = await Promise.all(
      collegesWithApps.map(async (c) => {
        const apps = await prisma.application.findMany({
          where: { collegeId: c.id, application_date: { ...dateFilter(from, to) }, ...hodFilter },
          select: { id: true, application_no: true, student_name: true, status: true, application_date: true },
        });
        return {
          College: c.college_name,
          "Total Apps": apps.length,
          Applications: apps.map((a) => ({ id: a.id, no: a.application_no, student: a.student_name })),
        };
      }),
    );
    sendResponse(res, report, ["College", "Total Apps", "Applications"], "college_wise_applications");
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ 9. Department Wise Posting â”€â”€â”€
reportRouter.get("/dept-posting", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const depts = await prisma.department.findMany();
    const report = await Promise.all(
      depts.map(async (d) => ({
        Department: d.department_name,
        Count: await prisma.application.count({
          where: {
            posting_department_id: d.id,
            posting_department: { is: { id: d.id } },
            ...(from || to ? { application_date: { ...dateFilter(from, to) } } : {}),
            ...hodFilter,
          },
        }),
      })),
    );
    sendResponse(res, report, ["Department", "Count"], "dept_posting");
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ 10. Recommended by Employee â”€â”€â”€
reportRouter.get("/recommended-by", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        employee_id: { not: null },
        application_date: { ...dateFilter(from, to) },
        ...hodFilter,
      },
      include: { employee: true },
    });
    const rows = apps.map((a) => ({
      Employee: a.employee?.name ?? "Unknown",
      "Emp No": a.employee?.employee_no ?? "",
      "App No": a.application_no,
      "Student Name": a.student_name,
      Status: a.status,
    }));
    sendResponse(res, rows, ["Employee", "Emp No", "App No", "Student Name", "Status"], "recommended_by_employee");
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ 11. Other References â”€â”€â”€
reportRouter.get("/other-references", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        applicant_type: "OTHER_REFERENCE",
        application_date: { ...dateFilter(from, to) },
        ...hodFilter,
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

// â”€â”€â”€ 12. Employee's Son/Daughter â”€â”€â”€
reportRouter.get("/employee-children", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        son_daughter: true,
        application_date: { ...dateFilter(from, to) },
        ...hodFilter,
      },
      include: { employee: true },
    });
    const rows = apps.map((a) => ({
      "App No": a.application_no,
      "Student Name": a.student_name,
      "Father Name": a.student_father_name,
      "Recommending Emp": a.employee?.name ?? "",
      Status: a.status,
    }));
    sendResponse(res, rows, ["App No", "Student Name", "Father Name", "Recommending Emp", "Status"], "employee_children");
  } catch (error) {
    next(error);
  }
});

// â”€â”€â”€ 13. Training During Financial Year â”€â”€â”€
reportRouter.get("/training-during-fy", async (req, res, next) => {
  try {
    const { from, to } = req.query as any;
    const hodFilter = await getHodDepartmentFilter(req as AuthRequest);
    const apps = await prisma.application.findMany({
      where: {
        status: {
          in: ["TRAINING_ACTIVE", "TRAINING_COMPLETED", "NO_DUES_PENDING", "CERTIFICATE_READY", "CERTIFICATE_ISSUED", "CLOSED"],
        },
        ...(from || to ? { application_date: { ...dateFilter(from, to) } } : {}),
        ...hodFilter,
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
