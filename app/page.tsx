"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="text-center mt-24">
      <h1 className="text-4xl font-bold mb-4">Taskflow</h1>
      <p className="text-gray-600 mb-8 text-lg">
        Simple task management for your projects
      </p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/login"
          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
