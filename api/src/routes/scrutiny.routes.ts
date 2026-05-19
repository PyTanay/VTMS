import { Router } from "express";
import { ApplicationStatus } from "@prisma/client";
import prisma from "../prisma";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";

export const scrutinyRouter = Router();
scrutinyRouter.use(authenticate);

// List applications pending scrutiny or already scrutinized
scrutinyRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};

    // If no status filter, default to applications needing scrutiny
    if (statusFilter) {
      where.status = statusFilter;
    } else {
      where.status = {
        in: [
          ApplicationStatus.SUBMITTED,
          ApplicationStatus.PENDING_APPROVAL,
          ApplicationStatus.APPROVED,
          ApplicationStatus.SCRUTINIZED,
        ],
      };
    }

    if (search) {
      where.OR = [
        { application_no: { contains: search, mode: "insensitive" } },
        { student_name: { contains: search, mode: "insensitive" } },
        { student_surname: { contains: search, mode: "insensitive" } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: {
        category: true,
        branch: true,
        college: true,
        recommending_employee: true,
        posting_department: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
});

// Get a single application's scrutiny details
scrutinyRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        category: true,
        branch: true,
        college: true,
        recommending_employee: true,
        posting_department: true,
        verifications: true,
      },
    });
    if (!application) return res.status(404).json({ success: false, message: "Application not found" });
    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
});

// Perform scrutiny — accepts scrutiny fields and transitions status
scrutinyRouter.post(
  "/:id",
  authorize(["ADMIN", "TRAINING_IN_CHARGE", "TRAINING_CENTER_SECTION_HEAD"]),
  async (req: AuthRequest, res, next) => {
    try {
      const id = Number(req.params.id);
      const { scrutiny_in_charge_id, scrutiny_date, scrutiny_remarks, approved_from, approved_to, status } = req.body;

      const data: any = {};
      if (scrutiny_in_charge_id !== undefined) data.scrutiny_in_charge_id = scrutiny_in_charge_id;
      if (scrutiny_date !== undefined) data.scrutiny_date = new Date(scrutiny_date);
      if (scrutiny_remarks !== undefined) data.scrutiny_remarks = scrutiny_remarks;
      if (approved_from !== undefined) data.approved_from = new Date(approved_from);
      if (approved_to !== undefined) data.approved_to = new Date(approved_to);
      data.status = status || ApplicationStatus.SCRUTINIZED;

      const updated = await prisma.application.update({ where: { id }, data });

      if (req.logAudit) {
        await req.logAudit("SCRUTINIZE", "application", id, undefined, {
          status: data.status,
          scrutiny_remarks: data.scrutiny_remarks,
        });
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);

// Update existing scrutiny details
scrutinyRouter.patch(
  "/:id",
  authorize(["ADMIN", "TRAINING_IN_CHARGE", "TRAINING_CENTER_SECTION_HEAD"]),
  async (req: AuthRequest, res, next) => {
    try {
      const id = Number(req.params.id);
      const allowedFields = ["scrutiny_in_charge_id", "scrutiny_date", "scrutiny_remarks", "approved_from", "approved_to", "status"];
      const data: any = {};

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === "scrutiny_date" || field === "approved_from" || field === "approved_to") {
            data[field] = new Date(req.body[field]);
          } else {
            data[field] = req.body[field];
          }
        }
      });

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, message: "No valid fields to update" });
      }

      const updated = await prisma.application.update({ where: { id }, data });

      if (req.logAudit) {
        await req.logAudit("UPDATE_SCRUTINY", "application", id, undefined, data);
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
);
