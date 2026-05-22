import prisma from "../prisma";

/**
 * VTMS Application Status Transition Engine
 *
 * Defines ALLOWED transitions and which roles can perform each transition.
 * Enforces business rules so applications cannot skip steps or move backward.
 * ADMIN role can override and perform any transition.
 */

type TransitionRule = {
  from: string[];
  to: string;
  allowedRoles: string[];
};

// ── Workflow Definition ──
const WORKFLOW: TransitionRule[] = [
  // Student submission flow
  { from: ["DRAFT"], to: "SUBMITTED", allowedRoles: ["APPLICANT", "RECOMMENDING_EMPLOYEE"] },
  { from: ["SUBMITTED"], to: "PENDING_APPROVAL", allowedRoles: ["ADMIN"] },

  // Approval flow
  { from: ["PENDING_APPROVAL"], to: "APPROVED", allowedRoles: ["ED_GM_APPROVER", "ADMIN"] },
  { from: ["PENDING_APPROVAL"], to: "REJECTED", allowedRoles: ["ED_GM_APPROVER", "ADMIN"] },
  { from: ["APPROVED"], to: "REJECTED", allowedRoles: ["ADMIN"] },

  // Training Center flow
  { from: ["APPROVED"], to: "RECEIVED_BY_TC", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Scrutiny flow
  { from: ["RECEIVED_BY_TC"], to: "SCRUTINIZED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },
  { from: ["SUBMITTED", "PENDING_APPROVAL", "APPROVED"], to: "SCRUTINIZED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Assign to in-charge
  { from: ["SCRUTINIZED"], to: "ASSIGNED_TO_INCHARGE", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },
  { from: ["RECEIVED_BY_TC"], to: "ASSIGNED_TO_INCHARGE", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Permission letter
  {
    from: ["ASSIGNED_TO_INCHARGE", "SCRUTINIZED"],
    to: "PERMISSION_LETTER_SENT",
    allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"],
  },

  // Joining flow
  {
    from: ["PERMISSION_LETTER_SENT"],
    to: "JOINING_PENDING",
    allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"],
  },

  // Document verification
  { from: ["JOINING_PENDING"], to: "DOCUMENTS_VERIFIED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },
  { from: ["JOINING_PENDING"], to: "BIODATA_COMPLETED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Gate pass
  {
    from: ["DOCUMENTS_VERIFIED", "BIODATA_COMPLETED"],
    to: "GATE_PASS_CREATED",
    allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"],
  },

  // Posting
  { from: ["GATE_PASS_CREATED"], to: "POSTED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Training active
  { from: ["POSTED"], to: "TRAINING_ACTIVE", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD", "TRAINING_IN_CHARGE"] },

  // No dues
  { from: ["TRAINING_ACTIVE"], to: "NO_DUES_PENDING", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Report submission
  { from: ["NO_DUES_PENDING"], to: "REPORT_SUBMITTED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Certificate flow
  { from: ["REPORT_SUBMITTED"], to: "CERTIFICATE_READY", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },
  { from: ["CERTIFICATE_READY"], to: "CERTIFICATE_ISSUED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },
  { from: ["CERTIFICATE_ISSUED"], to: "TRAINING_COMPLETED", allowedRoles: ["ADMIN", "TRAINING_CENTER_SECTION_HEAD"] },

  // Close
  { from: ["TRAINING_COMPLETED", "NO_DUES_PENDING"], to: "CLOSED", allowedRoles: ["ADMIN"] },
];

// ── Engine ──

/**
 * Check if a status transition is allowed for a given user role.
 * ADMIN can always override.
 */
export function canTransition(fromStatus: string, toStatus: string, userRole: string): boolean {
  // ADMIN can override any transition
  if (userRole === "ADMIN") return true;

  const rule = WORKFLOW.find((r) => r.from.includes(fromStatus) && r.to === toStatus);
  if (!rule) return false;

  return rule.allowedRoles.includes(userRole);
}

/**
 * Get all valid next statuses from a given status for a user role.
 */
export function getValidTransitions(fromStatus: string, userRole: string): string[] {
  if (userRole === "ADMIN") {
    // ADMIN can transition to any status
    return [...new Set(WORKFLOW.filter((r) => r.from.includes(fromStatus)).map((r) => r.to))];
  }

  return WORKFLOW.filter((r) => r.from.includes(fromStatus) && r.allowedRoles.includes(userRole)).map((r) => r.to);
}

/**
 * Execute a status transition: validate, update DB, create audit log.
 * Returns { success, message, application }
 */
export async function transitionApplication(
  applicationId: number,
  fromStatus: string,
  toStatus: string,
  userId: number,
  userRole: string,
  metadata?: Record<string, any>,
): Promise<{ success: boolean; message: string; application?: any }> {
  try {
    // Validate transition
    if (!canTransition(fromStatus, toStatus, userRole)) {
      return {
        success: false,
        message: `Transition from "${fromStatus}" to "${toStatus}" is not allowed for your role.`,
      };
    }

    // Update application status
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: toStatus as any,
        ...(metadata || {}),
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: "STATUS_CHANGE",
        entity_name: "Application",
        entity_id: applicationId,
        old_value: JSON.stringify({ status: fromStatus }),
        new_value: JSON.stringify({ status: toStatus, ...metadata }),
        timestamp: new Date(),
      },
    });

    return { success: true, message: `Status changed to "${toStatus}"`, application: updated };
  } catch (error: any) {
    return { success: false, message: `Transition failed: ${error?.message || "Unknown error"}` };
  }
}
