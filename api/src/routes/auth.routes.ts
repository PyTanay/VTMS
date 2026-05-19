import { Router } from "express";
import bcrypt from "bcryptjs";
import * as authController from "../controllers/auth.controller";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.get("/me", authenticate, authController.getCurrentUser);
authRouter.post("/logout", authenticate, authController.logout);

// Admin: Register a new user
authRouter.post("/register", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email, and password are required" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || "APPLICANT",
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    if (req.logAudit) {
      await req.logAudit("CREATE_USER", "user", user.id, undefined, { username, role: user.role });
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Admin: Reset another user's password
authRouter.put("/:id/password", authenticate, authorize(["ADMIN"]), async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    if (req.logAudit) {
      await req.logAudit("RESET_PASSWORD", "user", id, undefined, { resetBy: req.user?.username });
    }

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
});

// User: Change own password
authRouter.put("/me/password", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required" });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: "New password must be at least 4 characters" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});
