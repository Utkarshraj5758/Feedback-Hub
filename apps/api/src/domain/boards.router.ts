import { Router, type Request, type Response } from "express";
import {
  createBoardSchema,
  createPostSchema,
  updateBoardSchema,
} from "@feedbackhub/shared";
import { requireAuth } from "../auth/middleware.js";
import { getAuth, requireRole } from "../auth/requireRole.js";
import { param } from "../http/params.js";
import * as boards from "./boards.service.js";
import * as posts from "./posts.service.js";

export const boardsRouter = Router();
boardsRouter.use(requireAuth);

boardsRouter.get("/", async (req: Request, res: Response) => {
  const { org } = getAuth(req);
  res.json({ boards: await boards.listBoards(org.id) });
});

boardsRouter.post(
  "/",
  requireRole("owner", "admin"),
  async (req: Request, res: Response) => {
    const { org } = getAuth(req);
    const input = createBoardSchema.parse(req.body);
    res.status(201).json({ board: await boards.createBoard(org.id, input) });
  },
);

boardsRouter.get("/:id", async (req: Request, res: Response) => {
  const { org } = getAuth(req);
  res.json({ board: await boards.getBoard(org.id, param(req, "id")) });
});

boardsRouter.patch(
  "/:id",
  requireRole("owner", "admin"),
  async (req: Request, res: Response) => {
    const { org } = getAuth(req);
    const input = updateBoardSchema.parse(req.body);
    res.json({
      board: await boards.updateBoard(org.id, param(req, "id"), input),
    });
  },
);

boardsRouter.delete(
  "/:id",
  requireRole("owner", "admin"),
  async (req: Request, res: Response) => {
    const { org } = getAuth(req);
    await boards.deleteBoard(org.id, param(req, "id"));
    res.status(204).send();
  },
);

// Posts nested under a board (create / list).
boardsRouter.get("/:boardId/posts", async (req: Request, res: Response) => {
  const { org, user } = getAuth(req);
  res.json({
    posts: await posts.listPosts(org.id, param(req, "boardId"), user.id),
  });
});

boardsRouter.post("/:boardId/posts", async (req: Request, res: Response) => {
  const { org, user } = getAuth(req);
  const input = createPostSchema.parse(req.body);
  res.status(201).json({
    post: await posts.createPost(org.id, param(req, "boardId"), user.id, input),
  });
});
