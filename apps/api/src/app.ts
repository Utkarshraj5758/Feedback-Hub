import express, { type Express, type Request, type Response } from "express";

/**
 * Builds the Express app without binding a port. Kept separate from the server
 * bootstrap so Phase 1 Supertest tests can import and exercise it directly.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "api" });
  });

  return app;
}
