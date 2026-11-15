"use client";

import { useMemo, useState } from "react";
import { ChefHat, MapPin, ReceiptText } from "lucide-react";
import {
  addDays,
  groupByZone,
  isActive,
  kitchenPrep,
  needsPrep,
  statusGroup,
  todayDateOnly,
} from "@/lib/admin-analytics";
import { formatDeliveryDateHe, type DateOnly } from "@/lib/delivery-date";
import { groupOrdersByDeliveryDate, ORDER_STATUSES, ORDER_STATUS_LABEL, type LocalOrder, type OrderStatus } from "@/lib/local-admin";
import { formatILS } from "@/lib/money";
import { formatAddress } from "@/lib/il-address/validate";
import { formatQuantity } from "@/lib/quantity";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrdersStore } from "@/store/admin";
import { OrderLines, OrderStatusBadge, PaymentBadge } from "@/components/OrderCard";
import { primaryButton, quietButton } from "./AdminShell";
import { Segmented } from "./charts";

type DayFilter = "today" | "tomorrow" | "all";
type View = "kitchen" | "zones" | "orders";

/** The one step that usually comes next for an order. */
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  PENDING_PAYMENT: { to: "CONFIRMED", label: "אשר הזמנה" },
  CONFIRMED: { to: "IN_PREPARATION", label: "העבר להכנה" },
  IN_PREPARATION: { to: "COMPLETED", label: "סמן כנמסר" },
  READY: { to: "COMPLETED", label: "סמן כנמסר" },
  OUT_FOR_DELIVERY: { to: "COMPLETED", label: "סמן כנמסר" },
};

const addressText = (o: LocalOrder) =>
  o.address
    ? formatAddress(o.address)
    : "איסוף עצמי מהמטבח";

/** Kitchen totals per dish, delivery zones for the courier, and the full order cards. */
export function OrdersManager() {
  const hydrated = useHydrated();
  const orders = useOrdersStore((s) => s.orders);
  const [day, setDay] = useState<DayFilter>("today");
  const [view, setView] = useState<View>("kitchen");

  const today = todayDateOnly();
  const tomorrow = addDays(today, 1);
  const scoped = useMemo(
    () => (day === "all" ? orders : orders.filter((o) => o.deliveryDate === (day === "today" ? today : tomorrow))),
    [orders, day, today, tomorrow],
  );

  if (!hydrated) return <p className="py-16 text-center text-muted">טוען…</p>;

  const countFor = (date: DateOnly) => orders.filter((o) => o.deliveryDate === date && o.status !== "CANCELLED").length;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold">הזמנות והכנות מטבח</h1>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented
          value={day}
          onChange={setDay}
          label="יום אספקה"
          options={[
            { value: "today", label: "היום", badge: countFor(today) },
            { value: "tomorrow", label: "מחר", badge: countFor(tomorrow) },
            { value: "all", label: "כל ההזמנות", badge: orders.length },
          ]}
        />
        <Segmented
          value={view}
          onChange={setView}
          label="אופן התצוגה"
          options={[
            { value: "kitchen", label: "סיכום הכנות למטבח" },
            { value: "zones", label: "אזורי משלוח" },
            { value: "orders", label: "לפי הזמנה" },
          ]}
        />
      </div>

      {view === "kitchen" && <KitchenView orders={scoped} />}
      {view === "zones" && <ZonesView orders={scoped} />}
      {view === "orders" && <OrdersView orders={scoped} today={today} />}
    </div>
  );
}

function Empty({ icon: Icon, title, text }: { icon: typeof ChefHat; title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-paper p-10 text-center ring-1 ring-line">
      <Icon className="mx-auto size-8 text-muted" aria-hidden />
      <p className="mt-3 font-display text-2xl font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted">{text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 1. Kitchen prep: total per dish, per delivery day
// ---------------------------------------------------------------------------
function KitchenView({ orders }: { orders: LocalOrder[] }) {
  const prepped = useOrdersStore((s) => s.prepped);
  const togglePrepped = useOrdersStore((s) => s.togglePrepped);

  const toCook = orders.filter(needsPrep);
  const waiting = orders.filter((o) => statusGroup(o.status) === "pending").length;
  const dates = [...new Set(toCook.map((o) => o.deliveryDate))].sort();

  if (!dates.length) {
    return (
      <Empty
        icon={ChefHat}
        title="אין מה להכין כרגע"
        text={waiting ? `${waiting} הזמנות ממתינות לאישור. אחרי האישור המנות שלהן יופיעו כאן.` : "מנות של הזמנות שאושרו יופיעו כאן, מסוכמות לפי מנה."}
      />
    );
  }

  return (
    <div className="space-y-6">
      {waiting > 0 && (
        <p className="rounded-2xl bg-viz-yellow/15 px-4 py-2.5 text-sm text-amber-900">
          {waiting} הזמנות עדיין ממתינות לאישור ולא נכללות בסיכום. אשרו אותן בתצוגה ״לפי הזמנה״.
        </p>
      )}
      {dates.map((date) => {
        const dayOrders = toCook.filter((o) => o.deliveryDate === date);
        const rows = kitchenPrep(dayOrders);
        const done = rows.filter((r) => prepped[`${date}:${r.productId}`]).length;
        return (
          <section key={date} className="overflow-hidden rounded-3xl bg-paper ring-1 ring-line">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line p-5">
              <h2 className="font-display text-2xl font-bold">{formatDeliveryDateHe(date)}</h2>
              <p className="text-sm text-muted">
                {rows.length} מנות שונות · {dayOrders.length} הזמנות מאושרות
              </p>
              <p className="text-sm font-bold text-leaf-700 sm:ms-auto">{done} מתוך {rows.length} מוכנות</p>
            </div>
            <div className="h-1.5 bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={rows.length} aria-valuenow={done} aria-label="התקדמות ההכנות">
              <div className="h-full bg-leaf-600 transition-all" style={{ width: `${(done / rows.length) * 100}%` }} />
            </div>
            <table className="w-full text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="px-5 py-2.5 text-start font-medium">שם המנה</th>
                  <th scope="col" className="px-2 py-2.5 text-start font-medium">סה״כ להכנה</th>
                  <th scope="col" className="px-2 py-2.5 text-start font-medium">הזמנות</th>
                  <th scope="col" className="px-5 py-2.5 text-end font-medium">מוכן במטבח</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const key = `${date}:${r.productId}`;
                  const ready = !!prepped[key];
                  return (
                    <tr key={r.productId} className={`border-b border-line last:border-0 ${ready ? "bg-leaf-50/60 text-muted" : ""}`}>
                      <th scope="row" className={`px-5 py-3 text-start font-bold ${ready ? "line-through" : ""}`}>{r.name}</th>
                      <td className="px-2 py-3 font-display text-lg font-bold tabular-nums whitespace-nowrap">{formatQuantity(r.quantity, r.saleUnit)}</td>
                      <td className="px-2 py-3 tabular-nums">{r.orders}</td>
                      <td className="px-5 py-3 text-end">
                        <input
                          type="checkbox"
                          checked={ready}
                          onChange={() => togglePrepped(key)}
                          aria-label={`${r.name} מוכן במטבח`}
                          className="size-5 cursor-pointer accent-leaf-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Delivery zones: batches for the courier
// ---------------------------------------------------------------------------
function ZonesView({ orders }: { orders: LocalOrder[] }) {
  const zones = groupByZone(orders.filter(isActive));
  if (!zones.length) return <Empty icon={MapPin} title="אין משלוחים פעילים" text="הזמנות ממתינות ופתוחות יופיעו כאן, מחולקות לפי אזור המשלוח." />;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {zones.map((z) => (
        <section key={z.zone.id} className="rounded-3xl bg-paper p-5 ring-1 ring-line">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="size-5 text-viz-violet" aria-hidden />
            <h2 className="font-display text-xl font-bold">{z.zone.label}</h2>
            <span className="rounded-full bg-viz-violet/15 px-2.5 py-0.5 text-xs font-bold text-viz-violet sm:ms-auto">
              {z.zone.id === "pickup" ? `${z.orders.length} איסופים` : `${z.deliveries} משלוחים`}
            </span>
          </div>
          <ul className="mt-3 divide-y divide-line text-sm">
            {[...z.orders]
              .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate) || (a.address?.city ?? "").localeCompare(b.address?.city ?? "", "he"))
              .map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {o.contact.name} <span className="font-normal text-muted">· הזמנה {o.orderNumber}</span>
                    </p>
                    <p className="text-muted">
                      {addressText(o)} · <a dir="ltr" href={`tel:${o.contact.phone}`} className="hover:text-brand-600">{o.contact.phone}</a>
                    </p>
                    <p className="text-xs text-muted">{formatDeliveryDateHe(o.deliveryDate)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                  <span className="font-bold tabular-nums">{formatILS(o.totals.totalAgorot)}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Per order: full cards with quick status actions
// ---------------------------------------------------------------------------
const PAST_DAYS_SHOWN = 3;

function OrdersView({ orders, today }: { orders: LocalOrder[]; today: DateOnly }) {
  const setStatus = useOrdersStore((s) => s.setStatus);
  const [showAllPast, setShowAllPast] = useState(false);

  if (!orders.length) return <Empty icon={ReceiptText} title="אין הזמנות ליום הזה" text="הזמנה שתבוצע בקופה תופיע כאן, לפי יום האספקה שלה." />;

  const days = groupOrdersByDeliveryDate(orders, today);
  const upcoming = days.filter((d) => d.date >= today);
  const past = days.filter((d) => d.date < today);
  const shown = [...upcoming, ...(showAllPast ? past : past.slice(0, PAST_DAYS_SHOWN))];

  return (
    <div className="space-y-10">
      {shown.map((d) => (
        <section key={d.date} aria-label={`הזמנות ל${formatDeliveryDateHe(d.date)}`}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-3">
            <h2 className="font-display text-2xl font-bold">{formatDeliveryDateHe(d.date)}</h2>
            {d.date === today && <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-bold text-leaf-700">היום</span>}
            {d.date < today && <span className="rounded-full bg-line px-2 py-0.5 text-xs font-bold text-muted">עבר</span>}
            <p className="text-sm text-muted sm:ms-auto">
              {d.orders.length} הזמנות · <span className="font-bold text-ink tabular-nums">{formatILS(d.totalAgorot)}</span>
            </p>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {d.orders.map((o) => {
              const next = NEXT_STEP[o.status];
              return (
                <li key={o.id} className={`flex flex-col gap-3 rounded-3xl bg-paper p-5 ring-1 ring-line ${o.status === "CANCELLED" ? "opacity-70" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-bold">הזמנה {o.orderNumber}</h3>
                    <OrderStatusBadge status={o.status} />
                    <PaymentBadge payment={o.payment} />
                    {o.isDemo && <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted">לדוגמה</span>}
                    <span className="text-xs text-muted sm:ms-auto">{o.fulfillment === "DELIVERY" ? "🚚 משלוח" : "🏠 איסוף עצמי"}</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold">{o.contact.name}</p>
                    <p className="text-muted">
                      <a dir="ltr" href={`tel:${o.contact.phone}`} className="hover:text-brand-600">{o.contact.phone}</a>
                      {" · "}
                      <span dir="ltr" className="break-all">{o.contact.email}</span>
                    </p>
                    <p className="text-muted">
                      {addressText(o)}
                      {o.address?.notes ? ` · ${o.address.notes}` : ""}
                    </p>
                  </div>
                  <OrderLines order={o} />
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    {next && (
                      <button type="button" onClick={() => setStatus(o.id, next.to)} className={primaryButton}>
                        {next.label}
                      </button>
                    )}
                    <label className="ms-auto flex items-center gap-2 text-sm">
                      <span className="text-muted">סטטוס</span>
                      <select
                        value={o.status}
                        onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                        className="rounded-full bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {!showAllPast && past.length > PAST_DAYS_SHOWN && (
        <div className="text-center">
          <button type="button" onClick={() => setShowAllPast(true)} className={quietButton}>
            הצגת {past.length - PAST_DAYS_SHOWN} ימים קודמים
          </button>
        </div>
      )}
    </div>
  );
}
