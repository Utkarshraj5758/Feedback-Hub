import { PrismaClient } from "@prisma/client";

// Single PrismaClient per process. Cached on globalThis in dev so tsx hot
// reloads don't leak new connection pools on every restart.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
