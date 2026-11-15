"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { useDeliveryDate } from "@/lib/use-delivery-date";
import { calculateCartTotals, lineTotal } from "@/lib/pricing";
import { formatILS } from "@/lib/money";
import { formatQuantity } from "@/lib/quantity";
import type { CheckoutResult } from "@/lib/checkout";
import { demoPayment, EMPTY_CARD, validateCard, type CardDraft } from "@/lib/demo-payment";
import type { PaymentMethod } from "@/lib/local-admin";
import { useLocalAdminData } from "@/lib/use-live-catalog";
import { useAuth } from "@/context/AuthContext";
import { useOrdersStore } from "@/store/admin";
import { AddressFields, draftErrors, draftFromAddress, draftToInput, EMPTY_ADDRESS, type AddressDraft } from "@/components/AddressFields";
import { CartThumb } from "@/components/CartThumb";
import { PaymentOverlay, PaymentSection } from "@/components/checkout/PaymentSection";
import { DeliveryDateNote, FulfillmentToggle, OrderSummary } from "@/components/OrderSummary";
import { prepareOrder } from "./actions";

type Fields = { name: string; phone: string; email: string; apartment: string; notes: string };
const EMPTY: Fields = { name: "", phone: "", email: "", apartment: "", notes: "" };
const ADDRESS_KEYS = ["city", "street", "houseNumber", "floor", "entrance"] as const;
const CARD_KEYS = ["cardNumber", "cardExpiry", "cardCvv", "cardId"];

/** How long the demo "processing" sheet and its approval tick stay up. */
const PROCESSING_MS = 1600;
const APPROVED_MS = 750;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const without = (errors: Record<string, string>, keys: readonly string[]) => Object.fromEntries(Object.entries(errors).filter(([k]) => !keys.includes(k)));

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
  const [card, setCard] = useState<CardDraft>(EMPTY_CARD);
  const [pay, setPay] = useState<{ phase: "validating" | "processing" | "success"; method: PaymentMethod; totalLabel: string } | null>(null);
  const router = useRouter();
  const set = (k: keyof Fields) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  // A signed-in customer doesn't retype what the account already knows.
  useEffect(() => {
    if (!user) return;
    setF((s) => ({ ...s, name: s.name || user.name, email: s.email || user.email, phone: s.phone || (user.phone ?? "") }));
    if (user.address) setAddress((a) => (a === EMPTY_ADDRESS ? draftFromAddress(user.address) : a));
  }, [user]);

  if (!hydrated) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">טוען…</div>;

  if (!lines.length && !pay) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">אין מה לשלם עליו… עדיין</h1>
        <Link href="/catalog" className="inline-block rounded-full bg-ink px-7 py-3 font-bold text-paper hover:bg-brand-500">
          לתפריט המלא
        </Link>
      </div>
    );
  }

  function showFirstError() {
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
    });
  }

  /** DEMO payment: validate the order on the server, "process" for a moment, save it as paid, go to the confirmation. */
  async function payWith(method: PaymentMethod) {
    if (!delivery || pay) return;
    const isDelivery = fulfillment === "DELIVERY";
    // The card never leaves the browser; wallets have no fields to check.
    const cardErrors = method === "CARD" ? validateCard(card) : {};
    setPay({ phase: "validating", method, totalLabel: formatILS(totals.totalAgorot) });
    try {
      const contact = { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() };
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
      if (!res.ok || Object.keys(cardErrors).length) {
        // The form's own wording wins for a city or street that was typed but not picked from the list.
        setErrors({ ...(!res.ok && res.errors), ...(isDelivery && draftErrors(address)), ...cardErrors });
        setPay(null);
        showFirstError();
        return;
      }
      setErrors({});
      const { totals: priced } = res.order;
      setPay({ phase: "processing", method, totalLabel: formatILS(priced.totalAgorot) });
      await sleep(PROCESSING_MS);
      // Mock persistence: the order is saved in this browser (store/admin.ts), not in a database.
      const order = placeOrder({
        userEmail: user?.email ?? null,
        fulfillment: res.order.fulfillment,
        deliveryDate: res.order.deliveryDate,
        contact,
        // Only the address the server verified (official names and codes) is kept.
        address: res.order.address,
        lines: res.order.lines,
        totals: {
          subtotalAgorot: priced.subtotalAgorot,
          savingsAgorot: priced.savingsAgorot,
          deliveryFeeAgorot: priced.deliveryFeeAgorot,
          totalAgorot: priced.totalAgorot,
        },
        payment: demoPayment(method, card),
      });
      setCard(EMPTY_CARD);
      setPay((p) => p && { ...p, phase: "success" });
      await sleep(APPROVED_MS);
      // The sheet stays up until the confirmation page replaces this one, so the emptied cart never flashes.
      router.push(`/checkout/confirmation/${order.id}`);
      clear();
    } catch {
      setErrors({ items: "משהו השתבש בעיבוד ההזמנה. נסו שוב." });
      setPay(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    void payWith("CARD");
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_400px]">
      {pay && pay.phase !== "validating" && <PaymentOverlay phase={pay.phase} method={pay.method} totalLabel={pay.totalLabel} />}
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
                setErrors((prev) => without(prev, ADDRESS_KEYS));
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

      <aside className="h-fit space-y-4 rounded-3xl bg-paper p-5 ring-1 ring-line lg:sticky lg:top-32 lg:col-start-2 lg:row-span-2 lg:row-start-1">
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
        <p className="text-center text-xs text-muted">🔒 המחיר הסופי מחושב ומאומת בשרת</p>
      </aside>

      {/* After the summary on a phone, under the details (first column) on a desktop. */}
      <div className="lg:col-start-1">
        <PaymentSection
          step={fulfillment === "DELIVERY" ? 4 : 3}
          totalLabel={formatILS(totals.totalAgorot)}
          card={card}
          onCardChange={(next) => {
            setCard(next);
            setErrors((prev) => without(prev, CARD_KEYS));
          }}
          errors={errors}
          disabled={!delivery || !totals.canCheckout}
          busy={!!pay}
          onWallet={(method) => void payWith(method)}
        />
      </div>
    </form>
  );
}
