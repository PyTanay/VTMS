import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import { getUsers } from "../controllers/user.controller";
import prisma from "../prisma";

export const userRouter = Router();

// Get all users (ADMIN only by default, but allow section heads to view too)
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
      select: { id: true, username: true, email: true, role: true, employeeId: true },
    });

    if (req.logAudit) {
      await req.logAudit("UPDATE_ROLE", "user", id, { role: existing.role }, { role: updated.role });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});
