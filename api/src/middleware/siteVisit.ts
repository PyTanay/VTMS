import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";

// Paths to track as "visits" (page views) - only exact matches
const TRACKED_PATHS = ["/api/applications", "/api/dashboard", "/api/health"];

// Track site visits for analytics
export const siteVisitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only track specific API paths (not all GET requests)
  const shouldTrack = TRACKED_PATHS.includes(req.path);

  if (shouldTrack && req.method === "GET") {
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
