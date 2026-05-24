import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../prisma";

// Helper: Fetch user with employee details
const userWithEmployeeSelect = {
  id: true,
  username: true,
  role: true,
  email: true,
  employeeId: true,
  employee: {
    select: {
      id: true,
      employee_no: true,
      name: true,
      designation: true,
      department: true,
      status: true,
    },
  },
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required" });
    }
    let user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      // Allow login via employee number when the user is linked to an employee record.
      const employee = await prisma.employee.findUnique({ where: { employee_no: username } });
      if (employee) {
        user = await prisma.user.findUnique({ where: { employeeId: employee.id } });
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Fetch full user with employee details
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: userWithEmployeeSelect,
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, employeeId: user.employeeId },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "24h" },
    );

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.json({
      success: true,
      token,
      user: fullUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Not authenticated" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: userWithEmployeeSelect,
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
};

// Update user email (self-service)
export const updateEmail = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Valid email is required" });
    }
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { email },
      select: { id: true, email: true },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};
