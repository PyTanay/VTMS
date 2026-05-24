import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";

export const emailConfigRouter = Router();
emailConfigRouter.use(authenticate);
emailConfigRouter.use(authorize(["ADMIN"]));

// List all configs
emailConfigRouter.get("/", async (_req: AuthRequest, res, next) => {
  try {
    const configs = await prisma.emailConfig.findMany({ orderBy: { type: "asc" } });
    // Return defaults if none exist
    if (configs.length === 0) {
      const defaults = ["GLOBAL", "APPROVAL", "PERMISSION", "CERTIFICATE", "NODUE", "REMINDER"].map((type) => ({
        id: 0,
        type,
        enabled: true,
        dev_mode: false,
      }));
      return res.json({ success: true, data: defaults });
    }
    res.json({ success: true, data: configs });
  } catch (error) {
    next(error);
  }
});

// Toggle a config (enabled or dev_mode)
emailConfigRouter.patch("/:type", async (req: AuthRequest, res, next) => {
  try {
    const type = req.params.type as string;
    const { enabled, dev_mode } = req.body;

    const updateData: any = {};
    if (typeof enabled === "boolean") updateData.enabled = enabled;
    if (typeof dev_mode === "boolean") updateData.dev_mode = dev_mode;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "enabled or dev_mode must be provided" });
    }

    const config = await prisma.emailConfig.upsert({
      where: { type },
      update: updateData,
      create: { type, enabled: enabled ?? true, dev_mode: dev_mode ?? false },
    });
    res.json({ success: true, data: config });
  } catch (error: any) {
    if (error?.code === "P2002") {
      // Handle race condition
      const config = await prisma.emailConfig.update({
        where: { type: req.params.type as string },
        data: { enabled: req.body.enabled, dev_mode: req.body.dev_mode },
      });
      return res.json({ success: true, data: config });
    }
    next(error);
  }
});

export default emailConfigRouter;
