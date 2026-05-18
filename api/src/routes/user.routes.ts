import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getUsers } from "../controllers/user.controller";

export const userRouter = Router();

userRouter.get("/", authenticate, authorize(["ADMIN"]), getUsers);
