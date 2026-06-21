"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface Card {
  id: string;
  title: string;
  description: string | null;
  order: number;
  assigneeId: string | null;
  dueDate: string | null;
  columnId: string;
  createdAt: string;
}

interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  cards: Card[];
}

interface Board {
  id: string;
  title: string;
}

export default function BoardDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New column input
  const [newColTitle, setNewColTitle] = useState("");
  const [creatingCol, setCreatingCol] = useState(false);

  // New card input per column
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({});

  // Edit card modal
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [savingCard, setSavingCard] = useState(false);

  // Fetch board and columns
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const boardRes = await fetch(`/api/boards/${boardId}`);
      if (!boardRes.ok) {
        if (boardRes.status === 404 || boardRes.status === 401) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to load board");
      }
      const boardData = await boardRes.json();
      setBoard(boardData);

      const colsRes = await fetch(`/api/boards/${boardId}/columns`);
      if (!colsRes.ok) throw new Error("Failed to load columns");
      const colsData: Column[] = await colsRes.json();

      // Fetch cards for each column
      const colsWithCards = await Promise.all(
        colsData.map(async (col) => {
          const cardsRes = await fetch(`/api/columns/${col.id}/cards`);
          const cards: Card[] = cardsRes.ok ? await cardsRes.json() : [];
          return { ...col, cards };
        })
      );
      setColumns(colsWithCards);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [boardId, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, boardId, fetchData, router]);

  // ---- Column operations ----
  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    setCreatingCol(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/columns`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newColTitle.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create column");
      const col = await res.json();
      setColumns((prev) => [...prev, { ...col, cards: [] }]);
      setNewColTitle("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingCol(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete column");
      setColumns((prev) => prev.filter((c) => c.id !== columnId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ---- Card operations ----
  const handleCreateCard = async (columnId: string) => {
    const title = newCardTitles[columnId]?.trim();
    if (!title) return;
    try {
      const res = await fetch(`/api/columns/${columnId}/cards`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create card");
      const card = await res.json();
      setColumns((prev) =>
        prev.map((c) =>
          c.id === columnId ? { ...c, cards: [...c.cards, card] } : c
        )
      );
      setNewCardTitles((prev) => ({ ...prev, [columnId]: "" }));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (card: Card) => {
    setEditingCard(card);
    setEditTitle(card.title);
    setEditDesc(card.description || "");
    setEditAssignee(card.assigneeId || "");
  };

  const handleSaveCard = async () => {
    if (!editingCard || !editTitle.trim()) return;
    setSavingCard(true);
    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDesc || null,
          assigneeId: editAssignee || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }
      const updated = await res.json();
      setColumns((prev) =>
        prev.map((c) => ({
          ...c,
          cards: c.cards.map((card) =>
            card.id === updated.id ? { ...card, ...updated } : card
          ),
        }))
      );
      setEditingCard(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete card");
      setColumns((prev) =>
        prev.map((c) => ({
          ...c,
          cards: c.cards.filter((card) => card.id !== cardId),
        }))
      );
      setEditingCard(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-gray-600"
          title="Back to dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{board?.title || "Board"}</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-400 hover:text-red-600 ml-2">&times;</button>
        </div>
      )}

      {/* Create column */}
      <form onSubmit={handleCreateColumn} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newColTitle}
          onChange={(e) => setNewColTitle(e.target.value)}
          placeholder="New column name..."
          className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={creatingCol || !newColTitle.trim()}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creatingCol ? "Adding..." : "Add Column"}
        </button>
      </form>

      {/* Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "60vh" }}>
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">{column.title}</h3>
              <button
                onClick={() => handleDeleteColumn(column.id)}
                className="text-gray-400 hover:text-red-500"
                title="Delete column"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-2 flex-1">
              {column.cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => openEdit(card)}
                  className="block w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <p className="font-medium text-sm text-gray-800">{card.title}</p>
                  {card.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
                  )}
                  {card.dueDate && (
                    <p className="text-xs text-indigo-600 mt-1">
                      Due {new Date(card.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Add card */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <input
                type="text"
                value={newCardTitles[column.id] || ""}
                onChange={(e) =>
                  setNewCardTitles((prev) => ({ ...prev, [column.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCard(column.id);
                }}
                placeholder="+ Add a card..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}

        {columns.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>No columns yet. Create one to get started.</p>
          </div>
        )}
      </div>

      {/* Edit card modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingCard(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Edit Card</h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Assignee ID (leave empty to clear)
                </label>
                <input
                  type="text"
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="User ID or leave blank"
                />
                {editAssignee && (
                  <p className="text-xs text-gray-400 mt-1">Must be a valid user ID, or leave blank.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => handleDeleteCard(editingCard.id)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCard}
                  disabled={savingCard || !editTitle.trim()}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCard ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
