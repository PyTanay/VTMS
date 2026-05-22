import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthUserPayload {
  id: number;
  username: string;
  role: string;
  employeeId?: number | null;
}

export interface AuthRequest extends Request {
  user?: AuthUserPayload;
  logAudit?: (action: string, entity: string, entityId: number, oldValue?: any, newValue?: any) => Promise<void> | void;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    if (typeof decoded !== "object" || decoded === null || !("id" in decoded) || !("role" in decoded)) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    req.user = {
      id: Number((decoded as any).id),
      username: String((decoded as any).username || ""),
      role: String((decoded as any).role),
      employeeId: (decoded as any).employeeId ? Number((decoded as any).employeeId) : null,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden: Insufficient privileges" });
    }

    next();
  };
};
