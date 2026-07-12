import { prisma } from "../src/db.js";

// Standalone connection check: proves the generated Prisma Client can reach the
// database (distinct from `migrate`, which uses its own engine). Run via
// `pnpm --filter @feedbackhub/api db:check`.
async function main() {
  const result = await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log("DB connection OK:", result);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err: unknown) => {
    console.error("DB connection FAILED:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
