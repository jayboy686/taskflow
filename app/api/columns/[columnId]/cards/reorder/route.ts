import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helpers";

// PATCH /api/columns/[columnId]/cards/reorder — batch reorder cards
// Body: { cardOrders: [{ id: string, order: number }, ...] }
export async function PATCH(
  request: Request,
  { params }: { params: { columnId: string } }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { cardOrders?: { id: string; order: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.cardOrders || !Array.isArray(body.cardOrders)) {
    return NextResponse.json(
      { error: "cardOrders array is required" },
      { status: 400 }
    );
  }

  // Verify ownership of all cards
  const cardIds = body.cardOrders.map((c) => c.id);
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    include: { column: { include: { board: { select: { userId: true } } } } },
  });

  if (cards.length !== cardIds.length) {
    return NextResponse.json({ error: "Some cards not found" }, { status: 404 });
  }

  const allOwned = cards.every(
    (card) => card.column.board.userId === user.id
  );
  if (!allOwned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Apply all order updates in a transaction
  await prisma.$transaction(
    body.cardOrders.map(({ id, order }) =>
      prisma.card.update({
        where: { id },
        data: { order },
      })
    )
  );

  return NextResponse.json({ success: true });
}
