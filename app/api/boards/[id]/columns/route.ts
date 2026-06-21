import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

async function findOwnedBoard(boardId: string, userId: string) {
  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board || board.userId !== userId) return null;
  return board;
}

async function findOwnedColumn(columnId: string, userId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { userId: true } } },
  });
  if (!column || column.board.userId !== userId) return null;
  return column;
}

// GET /api/boards/[id]/columns — list columns for a board
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const board = await findOwnedBoard(params.id, user.id);
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const columns = await prisma.column.findMany({
    where: { boardId: params.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(columns);
}

// POST /api/boards/[id]/columns — create a column
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const board = await findOwnedBoard(params.id, user.id);
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  let body: { title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const lastColumn = await prisma.column.findFirst({
    where: { boardId: params.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (lastColumn?.order ?? -1) + 1;

  const column = await prisma.column.create({
    data: {
      title: body.title.trim(),
      order: nextOrder,
      boardId: params.id,
    },
  });

  return NextResponse.json(column, { status: 201 });
}
