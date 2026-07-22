import { Router, type Request, type Response } from "express";
import { loginSchema, registerSchema } from "@feedbackhub/shared";
import { prisma } from "../db.js";
import { UnauthorizedError } from "../http/errors.js";
import { requireAuth } from "./middleware.js";
import { loginUser, registerUser, toPublicUser } from "./service.js";
import {
  REFRESH_COOKIE,
  refreshCookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./tokens.js";

export const authRouter = Router();

// Create a user + their organization + owner membership. Returns the user only.
authRouter.post("/register", async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);
  res.status(201).json({ user });
});

// Verify credentials → access token (body) + refresh token (httpOnly cookie).
authRouter.post("/login", async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const { user, orgId } = await loginUser(input);
  const accessToken = signAccessToken({ sub: user.id, orgId });
  res.cookie(REFRESH_COOKIE, signRefreshToken(user.id), refreshCookieOptions);
  res.status(200).json({ accessToken, user: toPublicUser(user) });
});

// Exchange a valid refresh cookie for a fresh access token.
authRouter.post("/refresh", async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!token) throw new UnauthorizedError("Missing refresh token");

  let userId: string;
  try {
    userId = verifyRefreshToken(token).sub;
  } catch {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Earliest membership = the user's home org (see loginUser), for stable refresh.
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (!membership) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    throw new UnauthorizedError("Invalid refresh token");
  }

  const accessToken = signAccessToken({ sub: userId, orgId: membership.orgId });
  res.status(200).json({ accessToken });
});

// Clear the refresh cookie.
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
  res.status(204).send();
});

// Protected: echoes the authenticated user/org/role.
authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({ auth: req.auth });
});
