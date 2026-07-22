import bcrypt from "bcryptjs";
import { Prisma, type User } from "@prisma/client";
import type { LoginInput, RegisterInput } from "@feedbackhub/shared";
import { prisma } from "../db.js";
import { ConflictError, UnauthorizedError } from "../http/errors.js";

const BCRYPT_COST = 12;

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

/** Strips passwordHash — the only shape of a user that leaves the server. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

/**
 * Registration: hash the password, then create the user, their organization,
 * and an owner membership atomically. Duplicate email surfaces as a 409.
 */
export async function registerUser(input: RegisterInput): Promise<PublicUser> {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const orgName = input.organizationName ?? `${input.name}'s Organization`;

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email: input.email, passwordHash, name: input.name },
      });
      const org = await tx.organization.create({ data: { name: orgName } });
      await tx.membership.create({
        data: { userId: created.id, orgId: org.id, role: "owner" },
      });
      return created;
    });
    return toPublicUser(user);
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ConflictError("An account with that email already exists");
    }
    throw err;
  }
}

export interface LoginResult {
  user: User;
  orgId: string;
}

/**
 * Verify credentials and resolve the org context. Uses one generic message for
 * both unknown email and bad password so the endpoint can't be used to probe
 * which emails are registered.
 */
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid credentials");

  // Deterministic org selection: the earliest membership is the org created for
  // the user at registration (their home org). Stable once Phase 3 invites add
  // later memberships, until explicit org-switching exists.
  const membership = await prisma.membership.findFirst({
    where: { userId: user.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  if (!membership) throw new UnauthorizedError("Invalid credentials");

  return { user, orgId: membership.orgId };
}
