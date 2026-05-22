import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { getUsers } from "../controllers/user.controller";
import prisma from "../prisma";

export const userRouter = Router();

// Get all users (ADMIN or Section Head)
userRouter.get("/", authenticate, authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD"]), getUsers);

// Update user role (ADMIN only)
userRouter.put("/:id/role", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: "Role is required" });
    }

    const validRoles = [
      "ADMIN",
      "RECOMMENDING_EMPLOYEE",
      "TRAINING_CENTER_SECTION_HEAD",
      "TRAINING_IN_CHARGE",
      "ED_GM_APPROVER",
      "APPLICANT",
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${validRoles.join(", ")}` });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, email: true, role: true, employeeId: true, active: true, suspended: true },
    });

    if (req.logAudit) {
      await req.logAudit("UPDATE_ROLE", "user", id, { role: existing.role }, { role: updated.role });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// ── Account Management ──

// POST /:id/deactivate - Soft-delete / deactivate user account
// RECOMMENDING_EMPLOYEE can deactivate themselves; ADMIN can deactivate any user
userRouter.post("/:id/deactivate", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Authorization: ADMIN can deactivate anyone; RECOMMENDING_EMPLOYEE can only deactivate themselves
    if (req.user?.role !== "ADMIN") {
      if (req.user?.id !== id || req.user?.role !== "RECOMMENDING_EMPLOYEE") {
        return res.status(403).json({ success: false, message: "Forbidden: You can only deactivate your own account" });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, username: true, email: true, role: true, active: true, suspended: true },
    });

    if (req.logAudit) {
      await req.logAudit("DEACTIVATE_USER", "user", id, { active: existing.active }, { active: false });
    }

    res.json({ success: true, data: updated, message: "User account deactivated" });
  } catch (error) {
    next(error);
  }
});

// POST /:id/reactivate - Reactivate user account (ADMIN only)
userRouter.post("/:id/reactivate", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { active: true, suspended: false },
      select: { id: true, username: true, email: true, role: true, active: true, suspended: true },
    });

    if (req.logAudit) {
      await req.logAudit("REACTIVATE_USER", "user", id, { active: existing.active }, { active: true });
    }

    res.json({ success: true, data: updated, message: "User account reactivated" });
  } catch (error) {
    next(error);
  }
});

// POST /:id/suspend - Suspend user account (ADMIN only)
userRouter.post("/:id/suspend", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { suspended: true, active: false },
      select: { id: true, username: true, email: true, role: true, active: true, suspended: true },
    });

    if (req.logAudit) {
      await req.logAudit("SUSPEND_USER", "user", id, { suspended: existing.suspended }, { suspended: true });
    }

    res.json({ success: true, data: updated, message: "User account suspended" });
  } catch (error) {
    next(error);
  }
});
