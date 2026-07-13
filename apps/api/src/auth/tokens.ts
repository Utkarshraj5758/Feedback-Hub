import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";
import { env } from "../config/env.js";

export const REFRESH_COOKIE = "refreshToken";

// TTLs typed against SignOptions so the string forms satisfy strict types.
const ACCESS_TTL: jwt.SignOptions["expiresIn"] = "15m";
const REFRESH_TTL: jwt.SignOptions["expiresIn"] = "7d";
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface AccessPayload {
  sub: string;
  orgId: string;
}

export interface RefreshPayload {
  sub: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  const payload = decoded as Partial<AccessPayload>;
  if (!payload.sub || !payload.orgId) {
    throw new Error("Malformed access token");
  }
  return { sub: payload.sub, orgId: payload.orgId };
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  const payload = decoded as Partial<RefreshPayload>;
  if (!payload.sub) {
    throw new Error("Malformed refresh token");
  }
  return { sub: payload.sub };
}

// Long-lived refresh token lives in an httpOnly cookie; secure only in prod so
// local http dev works. clearCookie must be called with matching options.
export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
  maxAge: REFRESH_MAX_AGE_MS,
};
