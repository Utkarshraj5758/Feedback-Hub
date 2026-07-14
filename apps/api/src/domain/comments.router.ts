import { Router, type Request, type Response } from "express";
import { updateCommentSchema } from "@feedbackhub/shared";
import { requireAuth } from "../auth/middleware.js";
import { getAuth } from "../auth/requireRole.js";
import { param } from "../http/params.js";
import * as comments from "./comments.service.js";

export const commentsRouter = Router();
commentsRouter.use(requireAuth);

commentsRouter.patch("/:id", async (req: Request, res: Response) => {
  const { org, user, role } = getAuth(req);
  const input = updateCommentSchema.parse(req.body);
  const comment = await comments.updateComment(
    org.id,
    param(req, "id"),
    { userId: user.id, role },
    input,
  );
  res.json({ comment });
});

commentsRouter.delete("/:id", async (req: Request, res: Response) => {
  const { org, user, role } = getAuth(req);
  await comments.deleteComment(org.id, param(req, "id"), {
    userId: user.id,
    role,
  });
  res.status(204).send();
});
