import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { syncSamvad, getSyncLogs, toggleNightlySync, clearSyncLogs, streamSyncLogs } from "../controllers/samvad.controller";

export const samvadRouter = Router();
samvadRouter.use(authenticate);
samvadRouter.use(authorize(["ADMIN"]));

samvadRouter.post("/sync", syncSamvad);
samvadRouter.get("/logs", getSyncLogs);
samvadRouter.delete("/logs", clearSyncLogs);
samvadRouter.get("/logs/stream", streamSyncLogs);
samvadRouter.post("/settings", toggleNightlySync);
