import express, { type Express, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import { authRouter } from "./auth/router.js";
import { boardsRouter } from "./domain/boards.router.js";
import { postsRouter } from "./domain/posts.router.js";
import { commentsRouter } from "./domain/comments.router.js";
import { errorHandler } from "./middleware/error.js";

/**
 * Builds the Express app without binding a port. Kept separate from the server
 * bootstrap so Supertest can import and exercise it directly.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "api" });
  });

  app.use("/auth", authRouter);
  app.use("/boards", boardsRouter);
  app.use("/posts", postsRouter);
  app.use("/comments", commentsRouter);

  // Error handler must be registered last.
  app.use(errorHandler);

  return app;
}
