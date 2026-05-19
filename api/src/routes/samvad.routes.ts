import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { syncSamvad, getSyncLogs, toggleNightlySync } from "../controllers/samvad.controller";

export const samvadRouter = Router();
samvadRouter.use(authenticate);
samvadRouter.use(authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD"]));

samvadRouter.post("/sync", syncSamvad);
samvadRouter.get("/logs", getSyncLogs);
samvadRouter.post("/settings", toggleNightlySync);
