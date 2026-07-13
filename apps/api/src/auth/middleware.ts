import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db.js";
import { UnauthorizedError } from "../http/errors.js";
import { toPublicUser } from "./service.js";
import { verifyAccessToken } from "./tokens.js";

const BEARER_PREFIX = "Bearer ";

/**
 * Verifies the access token from the Authorization header and loads the user,
 * org, and role onto req.auth. Role is read from the DB (not trusted from the
 * token) so role changes take effect immediately. Rejects 401 on any failure.
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: payload.sub, orgId: payload.orgId } },
    include: { user: true, org: true },
  });
  if (!membership) throw new UnauthorizedError("Invalid access token");

  req.auth = {
    user: toPublicUser(membership.user),
    org: membership.org,
    role: membership.role,
    membershipId: membership.id,
  };
  next();
}
