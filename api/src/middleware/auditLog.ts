import { AuthRequest } from "./auth";
import { Response, NextFunction } from "express";
import prisma from "../prisma";

export const logAudit = async (req: AuthRequest, action: string, entity: string, entityId: number, oldValue?: any, newValue?: any) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action,
        entity_name: entity,
        entity_id: entityId,
        old_value: oldValue ? JSON.stringify(oldValue) : undefined,
        new_value: newValue ? JSON.stringify(newValue) : undefined,
      },
    });
  } catch (err) {
    console.error("Failed to log audit", err);
  }
};

export const auditLoggingMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Attach logAudit function to request for use in routes
  (req as any).logAudit = (action: string, entity: string, entityId: number, oldVal?: any, newVal?: any) =>
    logAudit(req, action, entity, entityId, oldVal, newVal);
  next();
};

export default auditLoggingMiddleware;
