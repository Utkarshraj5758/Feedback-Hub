import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../http/errors.js";

/**
 * Framework errors thrown before our handlers (e.g. body-parser's malformed-JSON
 * SyntaxError, or "payload too large") carry a numeric 4xx status. Extract it so
 * we return a clean client error instead of masking it as a 500.
 */
function clientErrorStatus(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null) {
    const e = err as { status?: unknown; statusCode?: unknown };
    const status = typeof e.status === "number" ? e.status : e.statusCode;
    if (typeof status === "number" && status >= 400 && status < 500) {
      return status;
    }
  }
  return undefined;
}

// Central error handler. Express 5 forwards rejected promises from async
// handlers here automatically, so route code can just `throw`.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", issues: err.issues });
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    return res
      .status(409)
      .json({ error: "A record with that value already exists" });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  const clientStatus = clientErrorStatus(err);
  if (clientStatus) {
    return res.status(clientStatus).json({
      error: clientStatus === 400 ? "Malformed request body" : "Bad request",
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
};
