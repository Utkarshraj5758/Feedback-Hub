import { Router, type Request, type Response } from "express";
import {
  createCommentSchema,
  updatePostSchema,
  updatePostStatusSchema,
} from "@feedbackhub/shared";
import { requireAuth } from "../auth/middleware.js";
import { getAuth, requireRole } from "../auth/requireRole.js";
import { param } from "../http/params.js";
import * as posts from "./posts.service.js";
import * as votes from "./votes.service.js";
import * as comments from "./comments.service.js";

export const postsRouter = Router();
postsRouter.use(requireAuth);

postsRouter.get("/:id", async (req: Request, res: Response) => {
  const { org, user } = getAuth(req);
  res.json({ post: await posts.getPost(org.id, param(req, "id"), user.id) });
});

postsRouter.patch("/:id", async (req: Request, res: Response) => {
  const { org, user, role } = getAuth(req);
  const input = updatePostSchema.parse(req.body);
  const post = await posts.updatePost(
    org.id,
    param(req, "id"),
    { userId: user.id, role },
    input,
  );
  res.json({ post });
});

postsRouter.delete("/:id", async (req: Request, res: Response) => {
  const { org, user, role } = getAuth(req);
  await posts.deletePost(org.id, param(req, "id"), { userId: user.id, role });
  res.status(204).send();
});

// Status change is admin/owner only.
postsRouter.patch(
  "/:id/status",
  requireRole("owner", "admin"),
  async (req: Request, res: Response) => {
    const { org, user } = getAuth(req);
    const { status } = updatePostStatusSchema.parse(req.body);
    const post = await posts.updatePostStatus(
      org.id,
      param(req, "id"),
      status,
      user.id,
    );
    res.json({ post });
  },
);

postsRouter.post("/:postId/vote", async (req: Request, res: Response) => {
  const { org, user } = getAuth(req);
  res.json(await votes.toggleVote(org.id, param(req, "postId"), user.id));
});

postsRouter.get("/:postId/comments", async (req: Request, res: Response) => {
  const { org } = getAuth(req);
  res.json({
    comments: await comments.listComments(org.id, param(req, "postId")),
  });
});

postsRouter.post("/:postId/comments", async (req: Request, res: Response) => {
  const { org, user } = getAuth(req);
  const input = createCommentSchema.parse(req.body);
  res.status(201).json({
    comment: await comments.createComment(
      org.id,
      param(req, "postId"),
      user.id,
      input,
    ),
  });
});
