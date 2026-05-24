import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";

export const rolesRouter = Router();
rolesRouter.use(authenticate);
rolesRouter.use(authorize(["ADMIN"]));

// List all role mappings
rolesRouter.get("/", async (_req: AuthRequest, res, next) => {
  try {
    const mappings = await prisma.roleMapping.findMany({ orderBy: { designation: "asc" } });
    res.json({ success: true, data: mappings });
  } catch (error) {
    next(error);
  }
});

// Get unique designations for dropdown
rolesRouter.get("/designations", async (_req: AuthRequest, res, next) => {
  try {
    const designations = await prisma.employee.findMany({
      where: { active: true },
      select: { designation: true },
      distinct: ["designation"],
      orderBy: { designation: "asc" },
    });
    res.json({ success: true, data: designations.map((d) => d.designation) });
  } catch (error) {
    next(error);
  }
});

// Get unique employee statuses for filter
rolesRouter.get("/statuses", async (_req: AuthRequest, res, next) => {
  try {
    const statuses = await prisma.employee.findMany({
      where: { status: { not: null } },
      select: { status: true },
      distinct: ["status"],
      orderBy: { status: "asc" },
    });
    res.json({ success: true, data: statuses.map((s) => s.status) });
  } catch (error) {
    next(error);
  }
});

// Create role mapping
rolesRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { designation, role, description } = req.body;
    if (!designation || !role) {
      return res.status(400).json({ success: false, message: "Designation and role are required" });
    }
    const mapping = await prisma.roleMapping.create({ data: { designation, role, description } });
    res.status(201).json({ success: true, data: mapping });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "A mapping for this designation already exists" });
    }
    next(error);
  }
});

// Update role mapping
rolesRouter.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { role, description } = req.body;
    const mapping = await prisma.roleMapping.update({ where: { id }, data: { role, description } });
    res.json({ success: true, data: mapping });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Role mapping not found" });
    }
    next(error);
  }
});

// Delete role mapping
rolesRouter.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.roleMapping.delete({ where: { id } });
    res.json({ success: true, message: "Deleted" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Role mapping not found" });
    }
    next(error);
  }
});

// Apply designation → role
rolesRouter.post("/apply", async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.body;
    const results = { matched: 0, unmatched: 0, skipped: 0, errors: 0 };
    const mappings = await prisma.roleMapping.findMany();

    const employees = await prisma.employee.findMany({
      where: {
        active: true,
        user: null,
        ...(status ? { status } : {}),
      },
      select: { id: true, designation: true, email: true, status: true },
    });

    for (const emp of employees) {
      const mapping = mappings.find((m) => m.designation.toLowerCase() === emp.designation.toLowerCase());
      if (!mapping) {
        results.unmatched++;
        continue;
      }

      const existingUser = await prisma.user.findFirst({ where: { employeeId: emp.id } });
      if (existingUser) {
        results.skipped++;
        continue;
      }

      try {
        // Create user for this employee with the mapped role
        const username = emp.email.split("@")[0];
        const defaultPassword = "changeme123";
        await prisma.user.create({
          data: {
            username,
            email: emp.email,
            password: defaultPassword, // In production, hash this
            role: mapping.role,
            employeeId: emp.id,
            designation: emp.designation,
          },
        });
        results.matched++;
      } catch {
        results.errors++;
      }
    }

    // Log the apply operation
    await (prisma as any).roleMappingLog.create({
      data: {
        action: "APPLY",
        result: JSON.stringify(results),
        userId: req.user?.id,
      },
    });

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// Get role mapping logs
rolesRouter.get("/logs", async (_req: AuthRequest, res, next) => {
  try {
    const logs = await (prisma as any).roleMappingLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

export default rolesRouter;
