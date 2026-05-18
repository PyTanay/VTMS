import { Router } from "express";
import * as samvadController from "../controllers/samvad.controller";
import { authenticate, authorize } from "../middleware/auth";

export const samvadRouter = Router();

samvadRouter.post("/sync", authenticate, authorize(["ADMIN", "TRAINING_CENTER_SECTION_HEAD"]), samvadController.syncSamvad);
