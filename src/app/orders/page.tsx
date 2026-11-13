"use client";

import Link from "next/link";
import { AccountGate } from "@/components/auth/AccountGate";

/** Order history. Orders are not persisted yet (checkout step 2), so this is the empty state. */
export default function OrdersPage() {
  return (
    <AccountGate>
      {(user) => (
        <div className="mx-auto max-w-3xl px-4 py-14">
          <p className="text-sm font-bold text-brand-600">שלום, {user.name}</p>
          <h1 className="font-display text-4xl font-bold">ההזמנות שלי</h1>
          <div className="mt-8 rounded-3xl bg-paper p-10 text-center ring-1 ring-line">
            <p className="font-display text-2xl font-bold">עדיין אין כאן הזמנות</p>
            <p className="mt-2 text-sm text-muted">ההזמנות שתבצעו יופיעו כאן, עם הסטטוס והחשבונית.</p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              לתפריט
            </Link>
          </div>
        </div>
      )}
    </AccountGate>
  );
}
