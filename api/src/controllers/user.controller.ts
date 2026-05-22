import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        employeeId: true,
        active: true,
        suspended: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            employee_no: true,
            name: true,
            department: true,
            designation: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
