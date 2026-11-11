"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { useDeliveryDate } from "@/lib/use-delivery-date";
import { calculateCartTotals, lineTotal } from "@/lib/pricing";
import { formatILS } from "@/lib/money";
import { formatQuantity } from "@/lib/quantity";
import { formatDeliveryDateHe } from "@/lib/delivery-date";
import type { CheckoutResult, OrderDraft } from "@/lib/checkout";
import { CartThumb } from "@/components/CartThumb";
import { DeliveryDateNote, FulfillmentToggle, OrderSummary } from "@/components/OrderSummary";
import { prepareOrder } from "./actions";

type Fields = { name: string; phone: string; email: string; city: string; street: string; houseNumber: string; apartment: string; notes: string };
const EMPTY: Fields = { name: "", phone: "", email: "", city: "", street: "", houseNumber: "", apartment: "", notes: "" };

function Field({ id, label, value, onChange, error, type = "text", autoComplete, className = "" }: {
  id: keyof Fields; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string; className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`w-full rounded-xl bg-paper px-4 py-2.5 ring-1 outline-none focus:ring-2 focus:ring-brand-500 ${error ? "ring-brand-600" : "ring-line"}`}
      />
      {error && <span className="text-xs text-brand-700">{error}</span>}
    </label>
  );
}

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const delivery = useDeliveryDate();
  const { items, fulfillment, setFulfillment } = useCart();
  const lines = Object.values(items);
  const totals = calculateCartTotals(lines, fulfillment);

  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<OrderDraft | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof Fields) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  if (!hydrated) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">טוען…</div>;

  if (!lines.length && !confirmed) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">אין מה לשלם עליו… עדיין</h1>
        <Link href="/catalog" className="inline-block rounded-full bg-ink px-7 py-3 font-bold text-paper hover:bg-brand-500">
          לתפריט המלא
        </Link>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!delivery) return;
    startTransition(async () => {
      const res: CheckoutResult = await prepareOrder({
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        fulfillment,
        deliveryDate: delivery.date,
        contact: { name: f.name, phone: f.phone, email: f.email },
        address: fulfillment === "DELIVERY" ? { city: f.city, street: f.street, houseNumber: f.houseNumber, apartment: f.apartment, notes: f.notes } : undefined,
      });
      if (res.ok) {
        setErrors({});
        setConfirmed(res.order);
      } else {
        setErrors(res.errors);
      }
    });
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-16">
        <div className="space-y-2 text-center">
          <p className="text-5xl" aria-hidden>✓</p>
          <h1 className="font-display text-4xl font-bold">ההזמנה אומתה</h1>
          <p className="text-muted">
            {confirmed.fulfillment === "DELIVERY" ? "אספקה" : "איסוף"} ב{formatDeliveryDateHe(confirmed.deliveryDate)} · המחירים, הכמויות ודמי המשלוח חושבו מחדש בשרת.
          </p>
        </div>
        <div className="space-y-2 rounded-3xl bg-paper p-5 ring-1 ring-line">
          {confirmed.lines.map((l) => (
            <div key={l.productId} className="flex justify-between gap-3 text-sm">
              <span>{l.name} · {formatQuantity(l.quantity, l.saleUnit)}</span>
              <span className="tabular-nums">{formatILS(l.lineTotalAgorot)}</span>
            </div>
          ))}
          <div className="border-t border-line pt-3">
            <OrderSummary totals={confirmed.totals} fulfillment={confirmed.fulfillment} />
          </div>
        </div>
        <p className="rounded-2xl bg-cream p-4 text-center text-sm text-muted">
          השלב הבא בפרויקט: התחברות (מייל / Google / Apple), תשלום מאובטח וחשבונית דיגיטלית.
        </p>
        <button onClick={() => setConfirmed(null)} className="mx-auto block text-sm font-bold text-brand-600 hover:underline">
          ← חזרה לעריכה
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <div>
          <Link href="/cart" className="text-sm text-muted hover:text-ink">→ חזרה לסל</Link>
          <h1 className="font-display text-4xl font-bold">קופה</h1>
        </div>

        <section className="space-y-4 rounded-3xl bg-paper p-6 ring-1 ring-line">
          <h2 className="font-display text-2xl font-bold">1. איך תרצו לקבל?</h2>
          <FulfillmentToggle value={fulfillment} onChange={setFulfillment} />
          <DeliveryDateNote label={delivery?.label ?? null} pastCutoff={delivery?.pastCutoff} fulfillment={fulfillment} />
          {errors.deliveryDate && (
            <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700" role="alert">{errors.deliveryDate}</p>
          )}
          {fulfillment === "PICKUP" && (
            <p className="text-sm text-muted">איסוף מהמטבח של קאי, בין 10:00 ל-18:00. הכתובת המלאה תישלח במייל האישור.</p>
          )}
        </section>

        <section className="space-y-4 rounded-3xl bg-paper p-6 ring-1 ring-line">
          <h2 className="font-display text-2xl font-bold">2. פרטי התקשרות</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="name" label="שם מלא" value={f.name} onChange={set("name")} error={errors.name} autoComplete="name" className="sm:col-span-2" />
            <Field id="phone" label="טלפון" type="tel" value={f.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
            <Field id="email" label="מייל (לחשבונית)" type="email" value={f.email} onChange={set("email")} error={errors.email} autoComplete="email" />
          </div>
        </section>

        {fulfillment === "DELIVERY" && (
          <section className="space-y-4 rounded-3xl bg-paper p-6 ring-1 ring-line">
            <h2 className="font-display text-2xl font-bold">3. כתובת למשלוח</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field id="city" label="עיר" value={f.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" className="sm:col-span-2" />
              <Field id="street" label="רחוב" value={f.street} onChange={set("street")} error={errors.street} autoComplete="address-line1" className="sm:col-span-2" />
              <Field id="houseNumber" label="מספר בית" value={f.houseNumber} onChange={set("houseNumber")} error={errors.houseNumber} />
              <Field id="apartment" label="דירה" value={f.apartment} onChange={set("apartment")} autoComplete="address-line2" />
              <Field id="notes" label="הערות לשליח" value={f.notes} onChange={set("notes")} className="sm:col-span-2" />
            </div>
          </section>
        )}
      </div>

      <aside className="h-fit space-y-4 rounded-3xl bg-paper p-5 ring-1 ring-line lg:sticky lg:top-32">
        <h2 className="font-display text-2xl font-bold">ההזמנה שלך</h2>
        <ul className="max-h-72 space-y-3 overflow-y-auto">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3 text-sm">
              <CartThumb src={l.imageUrl} alt={l.name} icon={l.icon} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{l.name}</p>
                <p className="text-xs text-muted">{formatQuantity(l.quantity, l.saleUnit)}</p>
              </div>
              <span className="tabular-nums">{formatILS(lineTotal(l.unitPriceAgorot, l.quantity, l.saleUnit))}</span>
            </li>
          ))}
        </ul>
        {errors.items && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700" role="alert">{errors.items}</p>}
        <div className="border-t border-line pt-4">
          <OrderSummary totals={totals} fulfillment={fulfillment} />
        </div>
        <button
          type="submit"
          disabled={pending || !delivery || !totals.canCheckout}
          className="w-full rounded-full bg-ink py-3.5 font-bold text-paper transition hover:bg-brand-500 disabled:bg-line"
        >
          {pending ? "מאמת…" : `אישור הזמנה · ${formatILS(totals.totalAgorot)}`}
        </button>
        <p className="text-center text-xs text-muted">🔒 המחיר הסופי מחושב ומאומת בשרת</p>
      </aside>
    </form>
  );
}
