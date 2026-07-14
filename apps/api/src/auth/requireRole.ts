import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../http/errors.js";

/** req.auth is optional in the type; after requireAuth it is always set. */
export function getAuth(req: Request): NonNullable<Request["auth"]> {
  if (!req.auth) throw new UnauthorizedError();
  return req.auth;
}

export function isAdmin(role: Role): boolean {
  return role === "owner" || role === "admin";
}

/** Middleware factory: 403 unless the authenticated user's role is allowed. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { role } = getAuth(req);
    if (!roles.includes(role)) {
      throw new ForbiddenError("You do not have permission to perform this action");
    }
    next();
  };
}
