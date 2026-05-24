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
userRouter.post("/:id/deactivate", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

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

// DELETE /:id - Soft delete user account (ADMIN only)
userRouter.delete("/:id", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { active: false, suspended: true },
      select: { id: true, username: true, email: true, role: true, active: true, suspended: true },
    });

    if (req.logAudit) {
      await req.logAudit("DELETE_USER", "user", id, { active: existing.active }, { active: false });
    }

    res.json({ success: true, data: updated, message: "User deleted" });
  } catch (error) {
    next(error);
  }
});

// POST /cleanup/invalid - Find & flag users with invalid employee/fake emails (ADMIN only)
userRouter.post("/cleanup/invalid", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const allUsers = await prisma.user.findMany({ include: { employee: true } });
    const flagged: { id: number; username: string; reason: string }[] = [];

    for (const u of allUsers) {
      if (u.employeeId && !u.employee) {
        flagged.push({ id: u.id, username: u.username, reason: "Employee ID set but no employee record exists" });
        continue;
      }
      if (u.email && /^\d+@gnfc\.in$/.test(u.email)) {
        flagged.push({ id: u.id, username: u.username, reason: `Fake email pattern: ${u.email}` });
      }
    }

    let deactivated = 0;
    for (const f of flagged) {
      try {
        await prisma.user.update({ where: { id: f.id }, data: { active: false, suspended: true } });
        deactivated++;
      } catch {
        /* skip individual failures */
      }
    }

    res.json({
      success: true,
      message: `Cleanup complete. Found ${flagged.length} invalid users, deactivated ${deactivated}.`,
      data: flagged,
    });
  } catch (error) {
    next(error);
  }
});

// ── Email Notification Preferences ──

// GET /:id/email-preferences - Get user's email notification preferences
userRouter.get("/:id/email-preferences", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, emailPreferences: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PUT /:id/email-preferences - Update user's email notification preferences
userRouter.put("/:id/email-preferences", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({ success: false, message: "Preferences object is required" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { emailPreferences: preferences },
      select: { id: true, username: true, emailPreferences: true },
    });

    if (req.logAudit) {
      await req.logAudit("UPDATE_EMAIL_PREFERENCES", "user", id, null, { preferences });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// PUT /:id/toggle-all-notifications - Toggle all notifications for a user
userRouter.put("/:id/toggle-all-notifications", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ success: false, message: "enabled (boolean) is required" });
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { emailPreferences: true } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentPrefs = (user.emailPreferences as any) || {};
    const notificationTypes = ["GLOBAL", "APPROVAL", "PERMISSION", "CERTIFICATE", "NODUE", "REMINDER"];

    const newPrefs = { ...currentPrefs };
    notificationTypes.forEach((type) => {
      newPrefs[type] = enabled;
    });

    const updated = await prisma.user.update({
      where: { id },
      data: { emailPreferences: newPrefs },
      select: { id: true, username: true, emailPreferences: true },
    });

    if (req.logAudit) {
      await req.logAudit("TOGGLE_ALL_NOTIFICATIONS", "user", id, null, { enabled });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});
