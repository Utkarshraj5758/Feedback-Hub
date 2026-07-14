import type { Request } from "express";
import { BadRequestError } from "./errors.js";

// Express 5 types route params as `string | string[]`. For our single-value
// routes this narrows it to a plain string (400 if somehow missing).
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string") {
    throw new BadRequestError(`Missing route parameter: ${name}`);
  }
  return value;
}
