"use client";

import { groupOrdersByDeliveryDate, ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/local-admin";
import { DEFAULT_RULES } from "@/lib/config";
import { formatDeliveryDateHe, getZonedParts } from "@/lib/delivery-date";
import { formatILS } from "@/lib/money";
import { formatQuantity } from "@/lib/quantity";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrdersStore } from "@/store/admin";
import { OrderLines, OrderStatusBadge } from "@/components/OrderCard";

function todayInIsrael(): string {
  const { year, month, day } = getZonedParts(new Date(), DEFAULT_RULES.timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Orders grouped by delivery date, each day with a kitchen summary and a status control per order. */
export function OrdersManager() {
  const hydrated = useHydrated();
  const orders = useOrdersStore((s) => s.orders);
  const setStatus = useOrdersStore((s) => s.setStatus);

  if (!hydrated) return <p className="py-16 text-center text-muted">טוען…</p>;

  if (!orders.length) {
    return (
      <div className="rounded-3xl bg-paper p-10 text-center ring-1 ring-line">
        <p className="font-display text-2xl font-bold">עדיין אין הזמנות</p>
        <p className="mt-2 text-sm text-muted">הזמנה שתבוצע בקופה בדפדפן הזה תופיע כאן, לפי יום האספקה שלה.</p>
      </div>
    );
  }

  const today = todayInIsrael();
  const days = groupOrdersByDeliveryDate(orders, today);

  return (
    <div className="space-y-10">
      {days.map((day) => (
        <section key={day.date} aria-label={`הזמנות ל${formatDeliveryDateHe(day.date)}`}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-3">
            <h2 className="font-display text-2xl font-bold">{formatDeliveryDateHe(day.date)}</h2>
            {day.date === today && <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-bold text-leaf-700">היום</span>}
            {day.date < today && <span className="rounded-full bg-line px-2 py-0.5 text-xs font-bold text-muted">עבר</span>}
            <p className="text-sm text-muted sm:ms-auto">
              {day.orders.length} הזמנות · <span className="font-bold text-ink tabular-nums">{formatILS(day.totalAgorot)}</span>
            </p>
          </div>

          {day.summary.length > 0 && (
            <details className="mt-4 rounded-2xl bg-leaf-50 px-4 py-3 text-sm text-leaf-700">
              <summary className="cursor-pointer font-bold">סיכום יומי למטבח ({day.summary.length} מנות)</summary>
              <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {day.summary.map((s) => (
                  <li key={s.productId} className="flex justify-between gap-3">
                    <span>{s.name}</span>
                    <span className="font-bold tabular-nums">{formatQuantity(s.quantity, s.saleUnit)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {day.orders.map((o) => (
              <li key={o.id} className={`space-y-3 rounded-3xl bg-paper p-5 ring-1 ring-line ${o.status === "CANCELLED" ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-bold">הזמנה {o.orderNumber}</h3>
                  <OrderStatusBadge status={o.status} />
                  <span className="text-xs text-muted sm:ms-auto">{o.fulfillment === "DELIVERY" ? "🚚 משלוח" : "🏠 איסוף עצמי"}</span>
                </div>
                <div className="text-sm">
                  <p className="font-bold">{o.contact.name}</p>
                  <p className="text-muted">
                    <a dir="ltr" href={`tel:${o.contact.phone}`} className="hover:text-brand-600">{o.contact.phone}</a>
                    {" · "}
                    <span dir="ltr" className="break-all">{o.contact.email}</span>
                  </p>
                  {o.address && (
                    <p className="text-muted">
                      {o.address.street} {o.address.houseNumber}
                      {o.address.apartment ? `, דירה ${o.address.apartment}` : ""}, {o.address.city}
                      {o.address.notes ? ` · ${o.address.notes}` : ""}
                    </p>
                  )}
                </div>
                <OrderLines order={o} />
                <label className="flex items-center gap-3 border-t border-line pt-3 text-sm">
                  <span className="font-medium">סטטוס</span>
                  <select
                    value={o.status}
                    onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                    className="flex-1 rounded-full bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
