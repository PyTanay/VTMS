import { Request, Response, NextFunction } from "express";
import { runSyncJob } from "../jobs/samvadSync";

export const syncSamvad = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runSyncJob();
    res.json({ success: true, message: "SAMVAD sync completed", data: result });
  } catch (error) {
    next(error);
  }
};
