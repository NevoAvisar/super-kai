"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { useAuth } from "@/context/AuthContext";
import { loginHref } from "@/lib/safe-redirect";
import { useHydrated } from "@/lib/use-hydrated";
import { useDeliveryDate } from "@/lib/use-delivery-date";
import { calculateCartTotals, lineTotal } from "@/lib/pricing";
import { formatILS } from "@/lib/money";
import { QuantityStepper } from "@/components/QuantityStepper";
import { CartThumb } from "@/components/CartThumb";
import { DeliveryDateNote, FulfillmentToggle, OrderSummary } from "@/components/OrderSummary";

export default function CartPage() {
  const hydrated = useHydrated();
  const { user } = useAuth();
  const delivery = useDeliveryDate();
  const { items, fulfillment, setFulfillment, increment, decrement, remove } = useCart();
  const lines = Object.values(items);
  const totals = calculateCartTotals(lines, fulfillment);

  if (!hydrated) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">טוען סל…</div>;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">הסל שלך ריק</h1>
        <p className="text-muted">כל התפריט פתוח לגלישה – בלי הרשמה.</p>
        <Link href="/catalog" className="inline-block rounded-full bg-ink px-7 py-3 font-bold text-paper hover:bg-brand-500">
          לתפריט המלא
        </Link>
      </div>
    );
  }

  // QA fix (mobile): minmax(0,1fr) — the implicit "auto" grid track let the truncated
  // product names stretch the page to ~507px on a 360px phone (horizontal scroll).
  // HE: תיקון מובייל – העמודה התרחבה בגלל שמות ארוכים וגרמה לגלילה אופקית.
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-3">
        <h1 className="mb-2 font-display text-4xl font-bold">הסל שלי</h1>
        {lines.map((it) => (
          // QA (mobile): below 640px the stepper drops under the name, so the name keeps its width
          // and the +/− buttons stay at a 36px+ touch size. HE: במובייל הסטפר יורד מתחת לשם המנה.
          <div key={it.productId} className="flex items-start gap-3 rounded-3xl bg-paper p-3 ring-1 ring-line sm:items-center sm:gap-4">
            <CartThumb src={it.imageUrl} alt={it.name} icon={it.icon} />
            <div className="min-w-0 flex-1 space-y-2 sm:flex sm:items-center sm:gap-4 sm:space-y-0">
              <div className="min-w-0 sm:flex-1">
                <p className="truncate font-bold">{it.name}</p>
                <p className="text-xs text-muted">
                  {formatILS(it.unitPriceAgorot)} {it.saleUnit === "KG" ? "לק״ג" : "ליח׳"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="w-36 shrink-0">
                  <QuantityStepper
                    size="sm"
                    quantity={it.quantity}
                    saleUnit={it.saleUnit}
                    onIncrement={() => increment(it.productId)}
                    onDecrement={() => decrement(it.productId)}
                  />
                </div>
                <p className="text-left font-bold tabular-nums sm:w-20">
                  {formatILS(lineTotal(it.unitPriceAgorot, it.quantity, it.saleUnit))}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(it.productId)}
              className="-me-1 flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-brand-50 hover:text-brand-600"
              aria-label={`הסרת ${it.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      <aside className="h-fit space-y-4 rounded-3xl bg-paper p-5 ring-1 ring-line lg:sticky lg:top-32">
        <FulfillmentToggle value={fulfillment} onChange={setFulfillment} />
        <OrderSummary totals={totals} fulfillment={fulfillment} />
        <DeliveryDateNote label={delivery?.label ?? null} pastCutoff={delivery?.pastCutoff} fulfillment={fulfillment} />
        {/* QA: "Proceed to checkout" asks a guest to sign in first, then returns to /checkout. */}
        <Link
          href={user ? "/checkout" : loginHref("/checkout")}
          aria-disabled={!totals.canCheckout}
          className={`block rounded-full py-3.5 text-center font-bold text-paper transition ${
            totals.canCheckout ? "bg-ink hover:bg-brand-500" : "pointer-events-none bg-line"
          }`}
        >
          המשך לקופה
        </Link>
        {!user && <p className="text-center text-xs text-muted">נבקש להתחבר לפני התשלום. הסל יישמר.</p>}
      </aside>
    </div>
  );
}
