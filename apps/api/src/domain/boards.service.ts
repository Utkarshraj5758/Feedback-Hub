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
  await getBoard(orgId, id); // 404 unless the board is in this org
  return prisma.board.update({
    where: { id },
    data: { name: input.name, isPublic: input.isPublic },
  });
}

export async function deleteBoard(orgId: string, id: string) {
  await getBoard(orgId, id);
  await prisma.board.delete({ where: { id } });
}
