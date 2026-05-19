import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";

export const auditLogRouter = Router();
auditLogRouter.use(authenticate);
auditLogRouter.use(authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD"]));

// GET /api/audit-logs — list audit logs with filters
auditLogRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const { entity, action, userId, from, to, page = "1", perPage = "50" } = req.query as any;

    const where: any = {};

    if (entity) where.entity_name = entity;
    if (action) where.action = action;
    if (userId) where.userId = Number(userId);
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(perPage), 1);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, username: true, role: true } } },
        orderBy: { timestamp: "desc" },
        skip: (pageNumber - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      total,
      page: pageNumber,
      perPage: pageSize,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/audit-logs/entities — list distinct entity names for filtering
auditLogRouter.get("/entities", async (_req, res, next) => {
  try {
    const result = await prisma.auditLog.findMany({
      select: { entity_name: true },
      distinct: ["entity_name"],
      orderBy: { entity_name: "asc" },
    });
    res.json({ success: true, data: result.map((r) => r.entity_name) });
  } catch (error) {
    next(error);
  }
});

// GET /api/audit-logs/actions — list distinct action types for filtering
auditLogRouter.get("/actions", async (_req, res, next) => {
  try {
    const result = await prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    });
    res.json({ success: true, data: result.map((r) => r.action) });
  } catch (error) {
    next(error);
  }
});
