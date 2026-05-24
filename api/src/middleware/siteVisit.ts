import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

// Track site visits for analytics
export const siteVisitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only track API requests (not static files, health checks, etc.)
  if (req.path.startsWith("/api/") && req.method === "GET") {
    try {
      // Get user ID from auth if available (optional)
      const userId = (req as any).user?.id;

      // Get IP address (handle proxy headers)
      const ipAddress = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() || req.socket.remoteAddress || undefined;

      // Get user agent
      const userAgent = req.headers["user-agent"] || undefined;

      // Log the visit asynchronously (don't wait for it)
      (prisma as any).siteVisit
        .create({
          data: {
            path: req.path,
            userAgent,
            ipAddress,
            userId,
          },
        })
        .catch(() => {
          // Silently fail - don't block the request
        });
    } catch {
      // Silently fail - don't block the request
    }
  }
  next();
};

export default siteVisitMiddleware;
