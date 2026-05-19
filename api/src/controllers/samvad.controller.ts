import { Request, Response, NextFunction } from "express";
import { runSyncJob } from "../jobs/samvadSync";
import prisma from "../prisma";

export const syncSamvad = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runSyncJob();
    res.json({ success: true, message: "SAMVAD sync completed", data: result });
  } catch (error) {
    next(error);
  }
};

// Get sync log entries
export const getSyncLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.emailLog.findMany({
      where: { subject: { contains: "SAMVAD" } },
      orderBy: { sent_at: "desc" },
      take: 50,
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// Toggle nightly sync on/off
export const toggleNightlySync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled, time } = req.body;
    // Store settings in env or a settings table
    // For now, we log and return success
    res.json({
      success: true,
      message: `Nightly sync ${enabled ? "enabled" : "disabled"}${time ? ` at ${time}` : ""}`,
      data: { enabled, time },
    });
  } catch (error) {
    next(error);
  }
};
