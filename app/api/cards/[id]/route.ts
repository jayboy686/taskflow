import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

async function findOwnedCard(cardId: string, userId: string) {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: { column: { include: { board: { select: { userId: true } } } } },
  });
  if (!card || card.column.board.userId !== userId) return null;
  return card;
}

// GET /api/cards/[id] — get a single card
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await findOwnedCard(params.id, user.id);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(card);
}

// PATCH /api/cards/[id] — update a card
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await findOwnedCard(params.id, user.id);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: {
    title?: string;
    description?: string;
    order?: number;
    assigneeId?: string | null;
    dueDate?: string | null;
    columnId?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.order !== undefined) data.order = body.order;
  if (body.assigneeId !== undefined) {
    if (body.assigneeId) {
      // Verify assignee exists
      const assignee = await prisma.user.findUnique({ where: { id: body.assigneeId } });
      data.assigneeId = assignee ? body.assigneeId : null;
    } else {
      data.assigneeId = null;
    }
  }
  if (body.dueDate !== undefined) {
    data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  }
  if (body.columnId !== undefined) data.columnId = body.columnId;

  try {
    const updated = await prisma.card.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    const message = err?.meta?.cause || err?.message || "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/cards/[id] — delete a card
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await findOwnedCard(params.id, user.id);
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.card.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
