"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { useDeliveryDate } from "@/lib/use-delivery-date";
import { calculateCartTotals, lineTotal } from "@/lib/pricing";
import { formatILS } from "@/lib/money";
import { formatQuantity } from "@/lib/quantity";
import { formatDeliveryDateHe } from "@/lib/delivery-date";
import type { CheckoutResult } from "@/lib/checkout";
import type { CartTotals } from "@/lib/pricing";
import type { LocalOrder } from "@/lib/local-admin";
import { useLocalAdminData } from "@/lib/use-live-catalog";
import { useAuth } from "@/context/AuthContext";
import { useOrdersStore } from "@/store/admin";
import { AddressFields, draftErrors, draftFromAddress, draftToInput, EMPTY_ADDRESS, type AddressDraft } from "@/components/AddressFields";
import { CartThumb } from "@/components/CartThumb";
import { DeliveryDateNote, FulfillmentToggle, OrderSummary } from "@/components/OrderSummary";
import { prepareOrder } from "./actions";

type Fields = { name: string; phone: string; email: string; apartment: string; notes: string };
const EMPTY: Fields = { name: "", phone: "", email: "", apartment: "", notes: "" };
const ADDRESS_KEYS = ["city", "street", "houseNumber", "floor", "entrance"] as const;

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
  const { items, fulfillment, setFulfillment, clear } = useCart();
  const { user } = useAuth();
  const localAdmin = useLocalAdminData();
  const placeOrder = useOrdersStore((s) => s.placeOrder);
  const lines = Object.values(items);
  const totals = calculateCartTotals(lines, fulfillment);

  const [f, setF] = useState<Fields>(EMPTY);
  const [address, setAddress] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<{ order: LocalOrder; totals: CartTotals } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof Fields) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  // A signed-in customer doesn't retype what the account already knows.
  useEffect(() => {
    if (!user) return;
    setF((s) => ({ ...s, name: s.name || user.name, email: s.email || user.email, phone: s.phone || (user.phone ?? "") }));
    if (user.address) setAddress((a) => (a === EMPTY_ADDRESS ? draftFromAddress(user.address) : a));
  }, [user]);

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
      const contact = { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() };
      const isDelivery = fulfillment === "DELIVERY";
      const res: CheckoutResult = await prepareOrder(
        {
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          fulfillment,
          deliveryDate: delivery.date,
          contact,
          address: isDelivery ? { ...draftToInput(address), apartment: f.apartment, notes: f.notes } : undefined,
        },
        localAdmin,
      );
      if (res.ok) {
        // Mock persistence: the order is saved in this browser (store/admin.ts), not in a database.
        const { totals } = res.order;
        const order = placeOrder({
          userEmail: user?.email ?? null,
          fulfillment: res.order.fulfillment,
          deliveryDate: res.order.deliveryDate,
          contact,
          // Only the address the server verified (official names and codes) is kept.
          address: res.order.address,
          lines: res.order.lines,
          totals: {
            subtotalAgorot: totals.subtotalAgorot,
            savingsAgorot: totals.savingsAgorot,
            deliveryFeeAgorot: totals.deliveryFeeAgorot,
            totalAgorot: totals.totalAgorot,
          },
        });
        setErrors({});
        setConfirmed({ order, totals });
        clear();
        window.scrollTo({ top: 0 });
      } else {
        // The form's own wording wins for a city or street that was typed but not picked from the list.
        setErrors({ ...res.errors, ...(isDelivery && draftErrors(address)) });
      }
    });
  }

  if (confirmed) {
    const { order } = confirmed;
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-16">
        <div className="space-y-2 text-center">
          <p className="text-5xl" aria-hidden>✓</p>
          <h1 className="font-display text-4xl font-bold">ההזמנה התקבלה</h1>
          <p className="font-bold text-leaf-700">הזמנה מס׳ {order.orderNumber}</p>
          <p className="text-muted">
            {order.fulfillment === "DELIVERY" ? "אספקה" : "איסוף"} ב{formatDeliveryDateHe(order.deliveryDate)} · המחירים, הכמויות ודמי המשלוח חושבו מחדש בשרת.
          </p>
        </div>
        <div className="space-y-2 rounded-3xl bg-paper p-5 ring-1 ring-line">
          {order.lines.map((l) => (
            <div key={l.productId} className="flex justify-between gap-3 text-sm">
              <span>{l.name} · {formatQuantity(l.quantity, l.saleUnit)}</span>
              <span className="tabular-nums">{formatILS(l.lineTotalAgorot)}</span>
            </div>
          ))}
          <div className="border-t border-line pt-3">
            <OrderSummary totals={confirmed.totals} fulfillment={order.fulfillment} />
          </div>
        </div>
        <p className="rounded-2xl bg-cream p-4 text-center text-sm text-muted">
          גרסת הדגמה: ההזמנה נשמרה בדפדפן הזה בלבד, ללא תשלום. תשלום מאובטח וחשבונית דיגיטלית יתווספו עם החיבור לשרת.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href={user ? "/orders" : "/login"} className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-paper hover:bg-brand-500">
            {user ? "להזמנות שלי" : "התחברות לצפייה בהזמנות"}
          </Link>
          <Link href="/catalog" className="rounded-full px-7 py-3 text-sm font-bold ring-1 ring-line hover:bg-brand-50">
            חזרה לתפריט
          </Link>
        </div>
        {!user && (
          <p className="text-center text-xs text-muted">התחברו עם אותה כתובת מייל ({order.contact.email}) וההזמנה תופיע תחת ״ההזמנות שלי״.</p>
        )}
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
            <AddressFields
              hideLegend
              value={address}
              onChange={(next) => {
                setAddress(next);
                setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !(ADDRESS_KEYS as readonly string[]).includes(k))));
              }}
              errors={errors}
            />
            <div className="grid gap-4 sm:grid-cols-4">
              <Field id="apartment" label="דירה (לא חובה)" value={f.apartment} onChange={set("apartment")} autoComplete="address-line2" />
              <Field id="notes" label="הערות לשליח (לא חובה)" value={f.notes} onChange={set("notes")} className="sm:col-span-3" />
            </div>
            <p className="text-xs text-muted">עיר ורחוב נבחרים מהרשימה הרשמית של יישובי ורחובות ישראל, כדי שהשליח יגיע בדיוק אליכם.</p>
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
          {pending ? "שולח…" : `אישור הזמנה · ${formatILS(totals.totalAgorot)}`}
        </button>
        <p className="text-center text-xs text-muted">🔒 המחיר הסופי מחושב ומאומת בשרת</p>
      </aside>
    </form>
  );
}
