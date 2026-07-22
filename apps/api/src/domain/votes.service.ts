import { prisma } from "../db.js";
import { NotFoundError } from "../http/errors.js";

/**
 * Toggle the requesting user's upvote on a post (one vote per user per post,
 * enforced by the @@unique([postId, userId])). Org-scoped via the board.
 */
export async function toggleVote(orgId: string, postId: string, userId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, board: { orgId } },
    select: { id: true },
  });
  if (!post) throw new NotFoundError("Post not found");

  const existing = await prisma.vote.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    // Scope the delete through the post→board→org relation for defense-in-depth.
    await prisma.vote.deleteMany({
      where: { id: existing.id, post: { board: { orgId } } },
    });
  } else {
    await prisma.vote.create({ data: { postId, userId } });
  }

  const voteCount = await prisma.vote.count({ where: { postId } });
  return { voted: existing === null, voteCount };
}
