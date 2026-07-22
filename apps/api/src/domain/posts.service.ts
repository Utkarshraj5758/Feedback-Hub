import type { PostStatus } from "@prisma/client";
import type { CreatePostInput, UpdatePostInput } from "@feedbackhub/shared";
import { prisma } from "../db.js";
import { ForbiddenError, NotFoundError } from "../http/errors.js";
import { isAdmin } from "../auth/requireRole.js";

interface Actor {
  userId: string;
  role: "owner" | "admin" | "member";
}

interface PostRow {
  id: string;
  boardId: string;
  authorId: string;
  title: string;
  body: string;
  status: PostStatus;
  createdAt: Date;
  _count: { votes: number; comments: number };
  votes: { id: string }[];
}

function serialize(post: PostRow) {
  return {
    id: post.id,
    boardId: post.boardId,
    authorId: post.authorId,
    title: post.title,
    body: post.body,
    status: post.status,
    createdAt: post.createdAt,
    voteCount: post._count.votes,
    commentCount: post._count.comments,
    hasVoted: post.votes.length > 0,
  };
}

// Inline in each query so Prisma infers the precise result type (_count, votes).
function counts(userId: string) {
  return {
    _count: { select: { votes: true, comments: true } },
    votes: { where: { userId }, select: { id: true } },
  } as const;
}

async function assertBoardInOrg(orgId: string, boardId: string) {
  const board = await prisma.board.findFirst({
    where: { id: boardId, orgId },
    select: { id: true },
  });
  if (!board) throw new NotFoundError("Board not found");
}

export async function listPosts(orgId: string, boardId: string, userId: string) {
  await assertBoardInOrg(orgId, boardId);
  const posts = await prisma.post.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    include: counts(userId),
  });
  return posts.map(serialize);
}

export async function createPost(
  orgId: string,
  boardId: string,
  authorId: string,
  input: CreatePostInput,
) {
  await assertBoardInOrg(orgId, boardId);
  const post = await prisma.post.create({
    data: { boardId, authorId, title: input.title, body: input.body },
    include: counts(authorId),
  });
  return serialize(post);
}

export async function getPost(orgId: string, id: string, userId: string) {
  const post = await prisma.post.findFirst({
    where: { id, board: { orgId } },
    include: counts(userId),
  });
  if (!post) throw new NotFoundError("Post not found");
  return serialize(post);
}

async function loadOwnedPost(orgId: string, id: string, actor: Actor) {
  const post = await prisma.post.findFirst({
    where: { id, board: { orgId } },
    select: { id: true, authorId: true },
  });
  if (!post) throw new NotFoundError("Post not found");
  if (post.authorId !== actor.userId && !isAdmin(actor.role)) {
    throw new ForbiddenError("You can only modify your own posts");
  }
  return post;
}

export async function updatePost(
  orgId: string,
  id: string,
  actor: Actor,
  input: UpdatePostInput,
) {
  await loadOwnedPost(orgId, id, actor); // author-or-admin authz
  // Org scope in the write itself (defense-in-depth); updateMany needs the
  // compound relation filter since id alone isn't org-unique.
  const result = await prisma.post.updateMany({
    where: { id, board: { orgId } },
    data: { title: input.title, body: input.body },
  });
  if (result.count === 0) throw new NotFoundError("Post not found");
  return getPost(orgId, id, actor.userId);
}

export async function deletePost(orgId: string, id: string, actor: Actor) {
  await loadOwnedPost(orgId, id, actor); // author-or-admin authz
  const result = await prisma.post.deleteMany({
    where: { id, board: { orgId } },
  });
  if (result.count === 0) throw new NotFoundError("Post not found");
}

// Admin/owner only (enforced by requireRole at the route); still org-scoped.
export async function updatePostStatus(
  orgId: string,
  id: string,
  status: PostStatus,
  userId: string,
) {
  const result = await prisma.post.updateMany({
    where: { id, board: { orgId } },
    data: { status },
  });
  if (result.count === 0) throw new NotFoundError("Post not found");
  return getPost(orgId, id, userId);
}
