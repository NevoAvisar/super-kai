"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AccountGate } from "@/components/auth/AccountGate";

const tabs = [
  { href: "/admin", label: "סקירה" },
  { href: "/admin/products", label: "מוצרים" },
  { href: "/admin/promotions", label: "מבצעים" },
  { href: "/admin/orders", label: "הזמנות" },
  { href: "/admin/customers", label: "לקוחות" },
];

/** Frame of every /admin screen: admin-only gate, title, section tabs and the local-data notice. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <AccountGate adminOnly>
      {(user) => (
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-sm font-bold text-leaf-600">שלום, {user.name}</p>
          <h1 className="font-display text-4xl font-bold">ניהול אתר</h1>
          <nav aria-label="אזורי הניהול" className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((t) => {
              const on = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ring-1 transition ${
                    on ? "bg-ink text-paper ring-ink" : "bg-paper ring-line hover:ring-brand-500"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
          <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <b>מצב הדגמה.</b> השינויים נשמרים בדפדפן הזה בלבד: הם לא מאובטחים, ולקוחות במכשירים אחרים לא יראו אותם עד שהאתר יחובר לשרת.
          </p>
          <div className="mt-8">{children}</div>
        </div>
      )}
    </AccountGate>
  );
}

/** Shared field styles for the admin forms. */
export const inputClass =
  "w-full rounded-xl bg-paper px-3.5 py-2.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand-500";
export const primaryButton =
  "rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-brand-500 disabled:bg-line";
export const quietButton = "rounded-full px-4 py-2 text-sm font-bold ring-1 ring-line transition hover:bg-brand-50";

export function Labeled({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-brand-700">{error}</span>}
    </label>
  );
}

/** "12.50" → 1250 agorot; null when it isn't a valid, non-negative amount. */
export function parseShekels(text: string): number | null {
  const n = Number(text.trim().replace(",", "."));
  return text.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export const shekelsText = (agorot: number) => String(agorot / 100);
