import express from "express";
import { authenticate, authorize, AuthRequest } from "../middleware/auth";
import upload from "../middleware/upload";
import { uploadSingle, uploadMultiple } from "../controllers/upload.controller";
import prisma from "../prisma";

export const uploadRouter = express.Router();

uploadRouter.post("/file", upload.single("file"), uploadSingle);
uploadRouter.post("/files", upload.array("files", 10), uploadMultiple);

// Upload profile picture for a user
uploadRouter.post(
  "/profile-pic/:userId",
  authenticate,
  authorize(["ADMIN"]),
  upload.single("file"),
  async (req: AuthRequest, res, next) => {
    try {
      const userId = Number(req.params.userId);
      if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

      const url = `/uploads/${req.file.filename}`;
      res.json({ success: true, data: { url, filename: req.file.filename } });
    } catch (error) {
      next(error);
    }
  },
);

export default uploadRouter;
