"use client";

import { formatAddress } from "@/lib/il-address/validate";
import Link from "next/link";
import { AccountGate } from "@/components/auth/AccountGate";
import { OrderLines, OrderStatusBadge, PaymentBadge } from "@/components/OrderCard";
import type { AuthUser } from "@/context/AuthContext";
import { formatDeliveryDateHe } from "@/lib/delivery-date";
import { ordersForUser } from "@/lib/local-admin";
import { useOrdersStore } from "@/store/admin";

const placedAt = (iso: string) =>
  new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** The signed-in customer's orders. Mock data: read from this browser's localStorage (store/admin.ts). */
function MyOrders({ user }: { user: AuthUser }) {
  const orders = ordersForUser(useOrdersStore((s) => s.orders), user.email);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-sm font-bold text-brand-600">שלום, {user.name}</p>
      <h1 className="font-display text-4xl font-bold">ההזמנות שלי</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-paper p-10 text-center ring-1 ring-line">
          <p className="font-display text-2xl font-bold">עדיין אין כאן הזמנות</p>
          <p className="mt-2 text-sm text-muted">ההזמנות שתבצעו יופיעו כאן, עם הסטטוס העדכני.</p>
          <Link
            href="/catalog"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-500 px-6 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            לתפריט
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className={`space-y-3 rounded-3xl bg-paper p-5 ring-1 ring-line ${o.status === "CANCELLED" ? "opacity-70" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold">הזמנה {o.orderNumber}</h2>
                <OrderStatusBadge status={o.status} />
                <PaymentBadge payment={o.payment} />
                <span className="text-xs text-muted sm:ms-auto">הוזמן ב-{placedAt(o.createdAt)}</span>
              </div>
              <p className="rounded-2xl bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-700">
                📅 {o.fulfillment === "DELIVERY" ? "אספקה" : "איסוף עצמי"} ב{formatDeliveryDateHe(o.deliveryDate)}
                {o.address && ` · ${formatAddress(o.address)}`}
              </p>
              <OrderLines order={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return <AccountGate>{(user) => <MyOrders user={user} />}</AccountGate>;
}
