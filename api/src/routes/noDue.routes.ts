import { Router } from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";
import numberingService from "../services/numbering.service";

export const noDueRouter = Router();
noDueRouter.use(authenticate);

noDueRouter.get("/", async (_req: AuthRequest, res, next) => {
  try {
    const forms = await prisma.noDueForm.findMany({ include: { application: true, lines: true } });
    res.json({ success: true, data: forms });
  } catch (error) {
    next(error);
  }
});

// Get no-due form by applicationId
noDueRouter.get("/application/:applicationId", async (req, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    let form = await prisma.noDueForm.findUnique({ where: { applicationId }, include: { lines: true } });

    // Create if doesn't exist
    if (!form) {
      const ref = await numberingService.generateNoDueRef();
      form = await prisma.noDueForm.create({
        data: {
          applicationId,
          no_due_ref: ref,
          lines: {
            create: [
              { item_name: "Reference material" },
              { item_name: "Safety items / helmets" },
              { item_name: "Tools and equipment" },
            ],
          },
        },
        include: { lines: true },
      });
    }

    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
});

// Mark clearance line as cleared
noDueRouter.patch(
  "/line/:lineId/clear",
  authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"]),
  async (req: AuthRequest, res, next) => {
    try {
      const lineId = Number(req.params.lineId);
      const remarks = req.body.remarks;

      const line = await prisma.noDueClearanceLine.update({
        where: { id: lineId },
        data: { cleared: true, cleared_by_id: req.user?.id, cleared_at: new Date(), remarks },
      });

      if (req.logAudit) {
        await req.logAudit("CLEAR_LINE", "no_due_line", lineId, undefined, line);
      }

      res.json({ success: true, data: line });
    } catch (error) {
      next(error);
    }
  },
);

// Mark form as fully cleared
noDueRouter.patch("/:noDueId/finalize", authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD"]), async (req: AuthRequest, res, next) => {
  try {
    const noDueId = Number(req.params.noDueId);

    const updated = await prisma.noDueForm.update({ where: { id: noDueId }, data: { status: "CLEARED" } });

    if (req.logAudit) {
      await req.logAudit("FINALIZE", "no_due_form", noDueId, undefined, updated);
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});
