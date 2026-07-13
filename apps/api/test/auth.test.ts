import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

const app = createApp();

const TEST_EMAIL = "auth.slice.test@example.com";
const PASSWORD = "supersecret123";

// Tests run against the real Neon DB, so remove the test user (and the org it
// created) before each test and after the suite. Deleting the user cascades its
// membership; the org is then free to delete.
async function cleanup() {
  const user = await prisma.user.findUnique({
    where: { email: TEST_EMAIL },
    include: { memberships: true },
  });
  if (!user) return;
  const orgIds = user.memberships.map((m) => m.orgId);
  await prisma.user.delete({ where: { id: user.id } });
  if (orgIds.length > 0) {
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  }
}

function register() {
  return request(app)
    .post("/auth/register")
    .send({ email: TEST_EMAIL, password: PASSWORD, name: "Test User" });
}

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("auth", () => {
  it("registers a new user and never returns the password hash", async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("logs in with correct credentials", async () => {
    await register();

    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe("string");

    const cookies = (res.headers["set-cookie"] ?? []) as unknown as string[];
    const refresh = cookies.find((c) => c.startsWith("refreshToken="));
    expect(refresh).toBeDefined();
    expect(refresh).toMatch(/HttpOnly/i);
  });

  it("rejects login with the wrong password", async () => {
    await register();

    const res = await request(app)
      .post("/auth/login")
      .send({ email: TEST_EMAIL, password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects a protected route with no token", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });
});
