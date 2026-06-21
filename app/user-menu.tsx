"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">
        {session.user?.name || session.user?.email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Sign out
      </button>
    </div>
  );
}

export { UserMenu };
