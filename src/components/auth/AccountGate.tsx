"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { loginHref } from "@/lib/safe-redirect";

/**
 * Shows its content to signed-in users only (optionally admins only); everyone else gets a way forward.
 * QA fix: the copy promised "we'll bring you back here" but the link was a bare /login;
 * it now carries ?next=<this page>. HE: הקישור מחזיר עכשיו באמת לעמוד הנוכחי אחרי ההתחברות.
 */
export function AccountGate({ adminOnly, title, text, children }: {
  adminOnly?: boolean;
  /** Custom heading / text for the signed-out state (e.g. checkout). */
  title?: string;
  text?: string;
  children: (user: AuthUser) => ReactNode;
}) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  if (!ready) return <div className="min-h-[50vh]" />;

  if (!user || (adminOnly && user.role !== "admin")) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-display text-3xl font-bold">{user ? "העמוד הזה למנהלי האתר בלבד" : (title ?? "צריך להתחבר כדי להמשיך")}</h1>
        <p className="mt-2 text-sm text-muted">
          {user ? "החשבון שלך אינו חשבון מנהל." : (text ?? "התחברו לחשבון, ונחזיר אתכם לכאן.")}
        </p>
        <Link
          href={user ? "/" : loginHref(pathname)}
          className="mt-6 flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          {user ? "חזרה לדף הבית" : "התחברות"}
        </Link>
      </div>
    );
  }
  return <>{children(user)}</>;
}
