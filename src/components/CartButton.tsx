"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { calculateCartTotals } from "@/lib/pricing";
import { formatILS } from "@/lib/money";

export function CartButton() {
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const lines = Object.values(items);
  const { subtotalAgorot } = calculateCartTotals(lines, "PICKUP");

  return (
    <Link
      href="/cart"
      className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-paper transition hover:bg-brand-500"
    >
      <span aria-hidden>🛒</span>
      <span>{hydrated ? formatILS(subtotalAgorot) : formatILS(0)}</span>
      {hydrated && lines.length > 0 && (
        <span className="rounded-full bg-paper px-2 text-xs text-brand-700">{lines.length}</span>
      )}
    </Link>
  );
}
