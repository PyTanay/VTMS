import { Request, Response, NextFunction } from "express";
import { runSyncJob } from "../jobs/samvadSync";
import prisma from "../prisma";

// Store active SSE connections
const sseConnections = new Set<any>();

export const syncSamvad = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runSyncJob();
    res.json({ success: true, message: "SAMVAD sync completed", data: result });
  } catch (error) {
    next(error);
  }
};

// Get sync log entries from SamvadSyncLog table
export const getSyncLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await (prisma as any).samvadSyncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// Clear all sync logs
export const clearSyncLogs = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await (prisma as any).samvadSyncLog.deleteMany({});
    res.json({ success: true, message: "All sync logs cleared" });
  } catch (error) {
    next(error);
  }
};

// SSE endpoint for live log streaming
export const streamSyncLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected", message: "Connected to live log stream" })}\n\n`);

    // Store connection
    sseConnections.add(res);

    // Remove connection on close
    req.on("close", () => {
      sseConnections.delete(res);
    });

    // Send existing logs on connect
    const recentLogs = await (prisma as any).samvadSyncLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    for (const log of recentLogs) {
      res.write(`data: ${JSON.stringify({ type: "log", data: log })}\n\n`);
    }
  } catch (error) {
    next(error);
  }
};

// Broadcast log to all SSE connections
export const broadcastLog = (log: any) => {
  const data = `data: ${JSON.stringify({ type: "log", data: log })}\n\n`;
  sseConnections.forEach((conn) => {
    try {
      conn.write(data);
    } catch (e) {
      sseConnections.delete(conn);
    }
  });
};

// Toggle nightly sync on/off
export const toggleNightlySync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled, time } = req.body;
    // Store settings in env or a settings table
    // For now, we log and return success
    res.json({
      success: true,
      message: `Nightly sync ${enabled ? "enabled" : "disabled"}${time ? ` at ${time}` : ""}`,
      data: { enabled, time },
    });
  } catch (error) {
    next(error);
  }
};
