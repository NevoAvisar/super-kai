"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, ReceiptText, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const itemClass = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-50";

/** Header slot: the login link, or the signed-in user's avatar, links and logout. */
export function AuthMenu() {
  const { user, ready, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reserve the slot until localStorage is read, so the header doesn't jump.
  if (!ready) return <span className="h-9 w-16" aria-hidden />;

  if (!user) {
    return (
      <Link href="/login" className="text-sm font-medium hover:text-brand-600">
        התחברות
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="hidden h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-leaf-600 px-3 text-xs font-bold text-white transition hover:bg-leaf-700 sm:flex"
        >
          <Settings className="size-3.5" aria-hidden />
          ניהול אתר
        </Link>
      )}
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`החשבון של ${user.name}`}
          className="flex h-9 items-center gap-2 rounded-full px-1 text-sm sm:pe-2 font-medium ring-1 ring-line transition hover:bg-brand-50"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-brand-500 font-display text-sm font-bold text-white" aria-hidden>
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <span className="hidden max-w-32 truncate md:block">{user.name}</span>
          <ChevronDown className={`hidden size-3.5 text-muted transition sm:block ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
        {open && (
          <div role="menu" className="absolute end-0 top-full z-40 mt-2 w-56 rounded-2xl bg-paper p-2 shadow-[0_30px_60px_-30px_rgba(50,30,10,0.45)] ring-1 ring-line">
            <div className="border-b border-line px-3 pb-2 pt-1">
              <p className="truncate text-sm font-bold">{user.name}</p>
              <p dir="ltr" className="truncate text-right text-xs text-muted">
                {user.email}
              </p>
            </div>
            {user.role === "admin" && (
              <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={`${itemClass} mt-1 text-leaf-700 sm:hidden`}>
                <Settings className="size-4" aria-hidden />
                ניהול אתר
              </Link>
            )}
            <Link href="/orders" role="menuitem" onClick={() => setOpen(false)} className={`${itemClass} mt-1`}>
              <ReceiptText className="size-4 text-muted" aria-hidden />
              ההזמנות שלי
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                signOut();
                router.push("/");
              }}
              className={`${itemClass} text-brand-700`}
            >
              <LogOut className="size-4" aria-hidden />
              התנתקות
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
