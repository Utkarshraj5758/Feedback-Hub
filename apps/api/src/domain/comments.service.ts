import type { CreateCommentInput, UpdateCommentInput } from "@feedbackhub/shared";
import { prisma } from "../db.js";
import { ForbiddenError, NotFoundError } from "../http/errors.js";
import { isAdmin } from "../auth/requireRole.js";

interface Actor {
  userId: string;
  role: "owner" | "admin" | "member";
}

const withAuthor = {
  include: { author: { select: { id: true, name: true } } },
} as const;

async function assertPostInOrg(orgId: string, postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, board: { orgId } },
    select: { id: true },
  });
  if (!post) throw new NotFoundError("Post not found");
}

export async function listComments(orgId: string, postId: string) {
  await assertPostInOrg(orgId, postId);
  return prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    ...withAuthor,
  });
}

export async function createComment(
  orgId: string,
  postId: string,
  authorId: string,
  input: CreateCommentInput,
) {
  await assertPostInOrg(orgId, postId);
  return prisma.comment.create({
    data: { postId, authorId, body: input.body },
    ...withAuthor,
  });
}

async function loadOwnedComment(orgId: string, id: string, actor: Actor) {
  const comment = await prisma.comment.findFirst({
    where: { id, post: { board: { orgId } } },
    select: { id: true, authorId: true },
  });
  if (!comment) throw new NotFoundError("Comment not found");
  if (comment.authorId !== actor.userId && !isAdmin(actor.role)) {
    throw new ForbiddenError("You can only modify your own comments");
  }
  return comment;
}

export async function updateComment(
  orgId: string,
  id: string,
  actor: Actor,
  input: UpdateCommentInput,
) {
  await loadOwnedComment(orgId, id, actor); // author-or-admin authz
  const result = await prisma.comment.updateMany({
    where: { id, post: { board: { orgId } } },
    data: { body: input.body },
  });
  if (result.count === 0) throw new NotFoundError("Comment not found");
  const comment = await prisma.comment.findFirst({
    where: { id, post: { board: { orgId } } },
    ...withAuthor,
  });
  if (!comment) throw new NotFoundError("Comment not found");
  return comment;
}

export async function deleteComment(orgId: string, id: string, actor: Actor) {
  await loadOwnedComment(orgId, id, actor); // author-or-admin authz
  const result = await prisma.comment.deleteMany({
    where: { id, post: { board: { orgId } } },
  });
  if (result.count === 0) throw new NotFoundError("Comment not found");
}
