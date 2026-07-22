import request from "supertest";
import type { Role } from "@prisma/client";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";
import { signAccessToken } from "../src/auth/tokens.js";

const app = createApp();
const runId = `${Date.now().toString(36)}`;

interface Seeded {
  orgId: string;
  userId: string;
  token: string;
}

const orgIds: string[] = [];
const userIds: string[] = [];

async function seedOrg(tag: string): Promise<string> {
  const org = await prisma.organization.create({
    data: { name: `${tag}-${runId}` },
  });
  orgIds.push(org.id);
  return org.id;
}

async function seedUser(orgId: string, role: Role, tag: string): Promise<Seeded> {
  const user = await prisma.user.create({
    data: {
      email: `domain.${tag}.${runId}@example.com`,
      name: tag,
      passwordHash: "not-used-in-these-tests",
    },
  });
  userIds.push(user.id);
  await prisma.membership.create({ data: { userId: user.id, orgId, role } });
  return { orgId, userId: user.id, token: signAccessToken({ sub: user.id, orgId }) };
}

function auth(token: string) {
  return `Bearer ${token}`;
}

let orgA: string;
let orgB: string;
let ownerA: Seeded;
let memberA: Seeded;
let ownerB: Seeded;
// Shared board/post (created by beforeAll) used by tests 2–4.
let boardId: string;
let postId: string;

beforeAll(async () => {
  orgA = await seedOrg("orgA");
  orgB = await seedOrg("orgB");
  ownerA = await seedUser(orgA, "owner", "ownerA");
  memberA = await seedUser(orgA, "member", "memberA");
  ownerB = await seedUser(orgB, "owner", "ownerB");

  const board = await request(app)
    .post("/boards")
    .set("Authorization", auth(ownerA.token))
    .send({ name: "Shared Board" });
  boardId = board.body.board.id;

  const post = await request(app)
    .post(`/boards/${boardId}/posts`)
    .set("Authorization", auth(memberA.token))
    .send({ title: "Shared Post", body: "body" });
  postId = post.body.post.id;
});

afterAll(async () => {
  // Delete orgs first (cascades boards→posts→votes→comments + memberships),
  // then the users (whose authored rows are now gone).
  await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("domain", () => {
  it("lets an owner create a board and a member create a post in it", async () => {
    const board = await request(app)
      .post("/boards")
      .set("Authorization", auth(ownerA.token))
      .send({ name: "Feature Requests" });
    expect(board.status).toBe(201);
    expect(board.body.board.name).toBe("Feature Requests");

    const post = await request(app)
      .post(`/boards/${board.body.board.id}/posts`)
      .set("Authorization", auth(memberA.token))
      .send({ title: "Dark mode", body: "please" });
    expect(post.status).toBe(201);
    expect(post.body.post.title).toBe("Dark mode");
    expect(post.body.post.voteCount).toBe(0);
  });

  it("toggles a vote on and off", async () => {
    const on = await request(app)
      .post(`/posts/${postId}/vote`)
      .set("Authorization", auth(memberA.token));
    expect(on.status).toBe(200);
    expect(on.body).toEqual({ voted: true, voteCount: 1 });

    const off = await request(app)
      .post(`/posts/${postId}/vote`)
      .set("Authorization", auth(memberA.token));
    expect(off.status).toBe(200);
    expect(off.body).toEqual({ voted: false, voteCount: 0 });
  });

  it("blocks a member from changing post status but allows an owner", async () => {
    const blocked = await request(app)
      .patch(`/posts/${postId}/status`)
      .set("Authorization", auth(memberA.token))
      .send({ status: "done" });
    expect(blocked.status).toBe(403);

    const allowed = await request(app)
      .patch(`/posts/${postId}/status`)
      .set("Authorization", auth(ownerA.token))
      .send({ status: "done" });
    expect(allowed.status).toBe(200);
    expect(allowed.body.post.status).toBe("done");
  });

  it("isolates orgs: a user cannot read or post to another org's board", async () => {
    const read = await request(app)
      .get(`/boards/${boardId}`)
      .set("Authorization", auth(ownerB.token));
    expect(read.status).toBe(404);

    const post = await request(app)
      .post(`/boards/${boardId}/posts`)
      .set("Authorization", auth(ownerB.token))
      .send({ title: "sneaky", body: "x" });
    expect(post.status).toBe(404);
  });

  it("scopes writes by org: foreign 404 on update/delete/status; owner can update+delete own", async () => {
    // A foreign-org owner cannot mutate orgA's board or post, even though the
    // org scope now lives in the write itself (updateMany/deleteMany).
    const foreignUpdate = await request(app)
      .patch(`/boards/${boardId}`)
      .set("Authorization", auth(ownerB.token))
      .send({ name: "hijacked" });
    expect(foreignUpdate.status).toBe(404);

    const foreignStatus = await request(app)
      .patch(`/posts/${postId}/status`)
      .set("Authorization", auth(ownerB.token))
      .send({ status: "done" });
    expect(foreignStatus.status).toBe(404);

    const foreignDelete = await request(app)
      .delete(`/boards/${boardId}`)
      .set("Authorization", auth(ownerB.token));
    expect(foreignDelete.status).toBe(404);

    // Owner can update + delete a board in their own org (throwaway board).
    const created = await request(app)
      .post("/boards")
      .set("Authorization", auth(ownerA.token))
      .send({ name: "Temp Board" });
    const tempId = created.body.board.id;

    const update = await request(app)
      .patch(`/boards/${tempId}`)
      .set("Authorization", auth(ownerA.token))
      .send({ name: "Renamed" });
    expect(update.status).toBe(200);
    expect(update.body.board.name).toBe("Renamed");

    const del = await request(app)
      .delete(`/boards/${tempId}`)
      .set("Authorization", auth(ownerA.token));
    expect(del.status).toBe(204);
  });
});
