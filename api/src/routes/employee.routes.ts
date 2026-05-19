import { Router } from "express";
import prisma from "../prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const employeeRouter = Router();
employeeRouter.use(authenticate);

// List employees with search and filter
employeeRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    const department = req.query.department as string | undefined;
    const designation = req.query.designation as string | undefined;
    const active = req.query.active === "true" ? true : req.query.active === "false" ? false : undefined;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const perPage = Math.min(Math.max(Number(req.query.perPage) || 50, 1), 5000);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { employee_no: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { designation: { contains: search, mode: "insensitive" } },
      ];
    }

    if (department) where.department = { contains: department, mode: "insensitive" };
    if (designation) {
      const desigs = designation
        .split("|")
        .map((d) => d.trim())
        .filter(Boolean);
      if (desigs.length === 1) {
        where.designation = { contains: desigs[0], mode: "insensitive" };
      } else {
        where.OR = [...(where.OR || []), ...desigs.map((d) => ({ designation: { contains: d, mode: "insensitive" } }))];
      }
    }
    if (active !== undefined) where.active = active;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({ success: true, data: employees, total, page, perPage });
  } catch (error) {
    next(error);
  }
});

// Get single employee
employeeRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { id: true, username: true, role: true } } },
    });
    if (!employee) return res.status(404).json({ success: false, message: "Employee not found" });
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
});

// Get distinct departments
employeeRouter.get("/meta/departments", async (_req, res, next) => {
  try {
    const departments = await prisma.employee.findMany({
      select: { department: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    });
    res.json({ success: true, data: departments.map((d) => d.department) });
  } catch (error) {
    next(error);
  }
});

// Get distinct designations
employeeRouter.get("/meta/designations", async (_req, res, next) => {
  try {
    const designations = await prisma.employee.findMany({
      select: { designation: true },
      distinct: ["designation"],
      orderBy: { designation: "asc" },
    });
    res.json({ success: true, data: designations.map((d) => d.designation) });
  } catch (error) {
    next(error);
  }
});

// Get employee counts by department
employeeRouter.get("/meta/stats", async (_req, res, next) => {
  try {
    const departments = await prisma.employee.groupBy({
      by: ["department"],
      _count: { id: true },
      orderBy: { department: "asc" },
    });
    res.json({
      success: true,
      data: departments.map((d) => ({ department: d.department, count: d._count.id })),
    });
  } catch (error) {
    next(error);
  }
});
