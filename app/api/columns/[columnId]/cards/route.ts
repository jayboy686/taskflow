import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

// GET /api/columns/[columnId]/cards — list cards in a column, ordered by `order`
export async function GET(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const column = await prisma.column.findUnique({
    where: { id: params.columnId },
    include: { board: { select: { userId: true } } },
  });

  if (!column || column.board.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cards = await prisma.card.findMany({
    where: { columnId: params.columnId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(cards);
}

// POST /api/columns/[columnId]/cards — create a new card
export async function POST(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const column = await prisma.column.findUnique({
    where: { id: params.columnId },
    include: { board: { select: { userId: true } } },
  });

  if (!column || column.board.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { title?: string; description?: string; assigneeId?: string; dueDate?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Determine order: place at the end of the column
  const lastCard = await prisma.card.findFirst({
    where: { columnId: params.columnId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (lastCard?.order ?? -1) + 1;

  const card = await prisma.card.create({
    data: {
      title: body.title.trim(),
      description: body.description || null,
      order: nextOrder,
      assigneeId: body.assigneeId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      columnId: params.columnId,
    },
  });

  return NextResponse.json(card, { status: 201 });
}
