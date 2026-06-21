import type { Metadata } from "next";
import { Providers } from "./providers";
import { UserMenu } from "./user-menu";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskflow",
  description: "Task management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <header className="border-b border-gray-200 bg-white">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="text-lg font-bold text-indigo-600">Taskflow</Link>
              <UserMenu />
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
