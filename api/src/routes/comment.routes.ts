import { Router } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import prisma from "../prisma";

export const commentRouter = Router();
commentRouter.use(authenticate);

// GET /api/applications/:applicationId/comments — list comments for an application
commentRouter.get("/applications/:applicationId/comments", async (req: AuthRequest, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const comments = await prisma.comment.findMany({
      where: { applicationId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            employee: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
});

// POST /api/applications/:applicationId/comments — add a comment
commentRouter.post("/applications/:applicationId/comments", async (req: AuthRequest, res, next) => {
  try {
    const applicationId = Number(req.params.applicationId);
    const { content, parentId } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    // Verify application exists
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        applicationId,
        userId: req.user!.id,
        content: content.trim(),
        parentId: parentId || undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            employee: { select: { name: true } },
          },
        },
      },
    });

    if (req.logAudit) {
      await req.logAudit("ADD_COMMENT", "application", applicationId, undefined, { commentId: comment.id });
    }

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comments/:id — delete own comment
commentRouter.delete("/comments/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // Only the comment author or ADMIN can delete
    if (existing.userId !== req.user!.id && req.user?.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: You can only delete your own comments" });
    }

    await prisma.comment.delete({ where: { id } });

    if (req.logAudit) {
      await req.logAudit("DELETE_COMMENT", "application", existing.applicationId, undefined, { deletedCommentId: id });
    }

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
});
