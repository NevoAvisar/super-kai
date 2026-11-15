"use client";

import type { CartTotals, FulfillmentType } from "@/lib/pricing";
import { cutoffLabel, DEFAULT_RULES } from "@/lib/config";
import { formatILS } from "@/lib/money";

/** Totals block shared by the cart and checkout: subtotal, savings, delivery fee, total. */
export function OrderSummary({ totals, fulfillment }: { totals: CartTotals; fulfillment: FulfillmentType }) {
  const threshold = DEFAULT_RULES.freeDeliveryThresholdAgorot;
  const progress = Math.min(100, (totals.subtotalAgorot / threshold) * 100);

  return (
    <div className="space-y-4">
      {fulfillment === "DELIVERY" &&
        (totals.qualifiesForFreeDelivery ? (
          <p className="rounded-xl bg-leaf-50 px-3 py-2 text-sm font-medium text-leaf-700">✓ ההזמנה שלך זכאית למשלוח חינם</p>
        ) : (
          <div className="space-y-1.5 text-sm">
            <p>
              עוד <b>{formatILS(totals.amountToFreeDeliveryAgorot)}</b> למשלוח חינם (מעל {formatILS(threshold)})
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-leaf-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ))}

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>סכום ביניים</dt>
          <dd className="tabular-nums">{formatILS(totals.subtotalAgorot)}</dd>
        </div>
        {totals.savingsAgorot > 0 && (
          <div className="flex justify-between text-brand-600">
            <dt>חסכת במבצעים</dt>
            <dd className="tabular-nums">−{formatILS(totals.savingsAgorot)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>{fulfillment === "DELIVERY" ? "דמי משלוח" : "איסוף עצמי"}</dt>
          <dd className="tabular-nums">
            {totals.deliveryFeeAgorot ? formatILS(totals.deliveryFeeAgorot) : <span className="font-medium text-leaf-700">חינם</span>}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 font-display text-xl font-bold">
          <dt>סה״כ לתשלום</dt>
          <dd className="tabular-nums">{formatILS(totals.totalAgorot)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function FulfillmentToggle({ value, onChange }: { value: FulfillmentType; onChange: (f: FulfillmentType) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-full bg-cream p-1 text-sm font-bold" role="radiogroup" aria-label="אופן קבלת ההזמנה">
      {(["DELIVERY", "PICKUP"] as const).map((f) => (
        <button
          key={f}
          type="button"
          role="radio"
          aria-checked={value === f}
          onClick={() => onChange(f)}
          className={`rounded-full py-2 transition ${value === f ? "bg-paper shadow-sm" : "text-muted"}`}
        >
          {f === "DELIVERY" ? "🚚 משלוח" : "🏠 איסוף עצמי"}
        </button>
      ))}
    </div>
  );
}

export function DeliveryDateNote({ label, pastCutoff, fulfillment }: { label: string | null; pastCutoff?: boolean; fulfillment: FulfillmentType }) {
  return (
    <div className="rounded-2xl bg-leaf-50 p-3 text-sm text-leaf-700">
      <p className="font-bold">📅 {fulfillment === "DELIVERY" ? "אספקה" : "איסוף"} ב{label ?? "…"}</p>
      <p className="text-xs opacity-80">
        {/* QA: copy follows StoreRules instead of a hard-coded "14:30". Closed days (Saturday) can push it further. */}
        {pastCutoff
          ? `הוזמן אחרי ${cutoffLabel()}, לכן ההזמנה מתוכננת ליום שאחרי מחר (או ליום הפתוח הבא).`
          : `הזמנה עד ${cutoffLabel()} מסופקת למחרת (או ביום הפתוח הבא).`}
      </p>
    </div>
  );
}
