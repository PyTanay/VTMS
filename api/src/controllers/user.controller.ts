import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        employee: true,
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
