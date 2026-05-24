import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";

export const timelineRouter = Router();
timelineRouter.use(authenticate);

// GET /api/applications/:id/timeline — return full workflow history with durations
timelineRouter.get("/applications/:id/timeline", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);

    // Fetch all STATUS_CHANGE audit logs for this application
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entity_name: "Application",
        entity_id: id,
        action: "STATUS_CHANGE",
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            employee: { select: { name: true } },
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // Fetch current application state
    const application = await prisma.application.findUnique({
      where: { id },
      select: {
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Build timeline with duration calculations
    const timeline: Array<{
      status: string;
      timestamp: string;
      user: { id: number; username: string; role: string; employeeName: string | null } | null;
      duration?: string;
      isCurrent: boolean;
      isExecuted: boolean;
    }> = [];

    // Add "Created" as first step
    timeline.push({
      status: "CREATED",
      timestamp: application.createdAt.toISOString(),
      user: null,
      isCurrent: false,
      isExecuted: true,
    });

    // Process each transition
    for (let i = 0; i < auditLogs.length; i++) {
      const log = auditLogs[i];
      let newStatus = "";
      try {
        const newVal = JSON.parse(log.new_value || "{}");
        newStatus = newVal.status || "";
      } catch {
        newStatus = "";
      }

      // Calculate duration from previous step
      let duration: string | undefined;
      if (i > 0) {
        const prevTime = new Date(auditLogs[i - 1].timestamp).getTime();
        const currTime = new Date(log.timestamp).getTime();
        const diffMs = currTime - prevTime;
        duration = formatDuration(diffMs);
      } else {
        const prevTime = new Date(application.createdAt).getTime();
        const currTime = new Date(log.timestamp).getTime();
        const diffMs = currTime - prevTime;
        duration = formatDuration(diffMs);
      }

      timeline.push({
        status: newStatus || log.action,
        timestamp: log.timestamp.toISOString(),
        user: log.user
          ? {
              id: log.user.id,
              username: log.user.username,
              role: log.user.role,
              employeeName: log.user.employee?.name || null,
            }
          : null,
        duration,
        isCurrent: false,
        isExecuted: true,
      });
    }

    // Get all workflow steps and build complete timeline
    const allSteps = getWorkflowSteps();
    const completeTimeline: typeof timeline = [];

    // Track which steps have been executed
    const executedStatuses = new Set(timeline.map((t) => t.status));

    // Build complete timeline with all steps
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      const executedEntry = timeline.find((t) => t.status === step);

      if (executedEntry) {
        // Step was executed - use the actual data
        completeTimeline.push({ ...executedEntry });
      } else {
        // Step not yet executed - add placeholder
        completeTimeline.push({
          status: step,
          timestamp: "",
          user: null,
          duration: undefined,
          isCurrent: false,
          isExecuted: false,
        });
      }
    }

    // Mark current status - find the last entry with the current status
    const currentStatus = application.status;
    for (let i = completeTimeline.length - 1; i >= 0; i--) {
      if (completeTimeline[i].status === currentStatus) {
        completeTimeline[i].isCurrent = true;
        break;
      }
    }

    res.json({
      success: true,
      data: {
        currentStatus,
        timeline: completeTimeline,
        allStatuses: allSteps,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── Helpers ──

function formatDuration(ms: number): string {
  if (ms < 0) return "0m";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (parts.length === 0) return "<1m";

  return parts.join(" ");
}

function getWorkflowSteps(): string[] {
  return [
    "DRAFT",
    "SUBMITTED",
    "PENDING_APPROVAL",
    "APPROVED",
    "REJECTED",
    "RECEIVED_BY_TC",
    "SCRUTINIZED",
    "ASSIGNED_TO_INCHARGE",
    "PERMISSION_LETTER_SENT",
    "JOINING_PENDING",
    "DOCUMENTS_VERIFIED",
    "BIODATA_COMPLETED",
    "GATE_PASS_CREATED",
    "POSTED",
    "TRAINING_ACTIVE",
    "NO_DUES_PENDING",
    "REPORT_SUBMITTED",
    "CERTIFICATE_READY",
    "CERTIFICATE_ISSUED",
    "TRAINING_COMPLETED",
    "CLOSED",
  ];
}
