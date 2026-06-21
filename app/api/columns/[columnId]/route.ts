import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

async function findOwnedColumn(columnId: string, userId: string) {
  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: { board: { select: { userId: true } } },
  });
  if (!column || column.board.userId !== userId) return null;
  return column;
}

// GET /api/columns/[columnId] — get a single column
export async function GET(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const column = await findOwnedColumn(params.columnId, user.id);
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  return NextResponse.json(column);
}

// PATCH /api/columns/[columnId] — update a column
export async function PATCH(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const column = await findOwnedColumn(params.columnId, user.id);
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  let body: { title?: string; order?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    data.title = body.title.trim();
  }
  if (body.order !== undefined) data.order = body.order;

  const updated = await prisma.column.update({
    where: { id: params.columnId },
    data,
  });

  return NextResponse.json(updated);
}

// DELETE /api/columns/[columnId] — delete a column
export async function DELETE(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const column = await findOwnedColumn(params.columnId, user.id);
  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  await prisma.column.delete({
    where: { id: params.columnId },
  });

  return NextResponse.json({ success: true });
}
