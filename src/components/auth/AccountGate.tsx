"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth, type AuthUser } from "@/context/AuthContext";

/** Shows its content to signed-in users only (optionally admins only); everyone else gets a way forward. */
export function AccountGate({ adminOnly, children }: { adminOnly?: boolean; children: (user: AuthUser) => ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="min-h-[50vh]" />;

  if (!user || (adminOnly && user.role !== "admin")) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">{user ? "העמוד הזה למנהלי האתר בלבד" : "צריך להתחבר כדי להמשיך"}</h1>
        <p className="mt-2 text-sm text-muted">
          {user ? "החשבון שלך אינו חשבון מנהל." : "התחברו לחשבון, ונחזיר אתכם לכאן."}
        </p>
        <Link
          href={user ? "/" : "/login"}
          className="mt-6 flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          {user ? "חזרה לדף הבית" : "התחברות"}
        </Link>
      </div>
    );
  }
  return <>{children(user)}</>;
}
