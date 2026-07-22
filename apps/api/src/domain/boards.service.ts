import type { CreateBoardInput, UpdateBoardInput } from "@feedbackhub/shared";
import { prisma } from "../db.js";
import { NotFoundError } from "../http/errors.js";

export function listBoards(orgId: string) {
  return prisma.board.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBoard(orgId: string, id: string) {
  const board = await prisma.board.findFirst({ where: { id, orgId } });
  if (!board) throw new NotFoundError("Board not found");
  return board;
}

export function createBoard(orgId: string, input: CreateBoardInput) {
  return prisma.board.create({
    data: { orgId, name: input.name, isPublic: input.isPublic ?? false },
  });
}

export async function updateBoard(
  orgId: string,
  id: string,
  input: UpdateBoardInput,
) {
  // Org scope lives in the write itself, so isolation holds regardless of any
  // caller-side check. updateMany needs a compound where (id isn't org-unique).
  const result = await prisma.board.updateMany({
    where: { id, orgId },
    data: { name: input.name, isPublic: input.isPublic },
  });
  if (result.count === 0) throw new NotFoundError("Board not found");
  return getBoard(orgId, id);
}

export async function deleteBoard(orgId: string, id: string) {
  const result = await prisma.board.deleteMany({ where: { id, orgId } });
  if (result.count === 0) throw new NotFoundError("Board not found");
}
