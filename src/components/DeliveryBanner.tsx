"use client";

import { DEFAULT_RULES } from "@/lib/config";
import { formatILS } from "@/lib/money";
import { formatCountdown, useDeliveryDate } from "@/lib/use-delivery-date";

export function DeliveryBanner() {
  const d = useDeliveryDate();
  const text = !d
    ? "מזמינים היום – מקבלים מחר"
    : d.pastCutoff
      ? `ההזמנות להיום נסגרו ב-14:30 · הזמנה עכשיו תסופק ב${d.label}`
      : `הזמינו בתוך ${formatCountdown(d.minutesToCutoff!)} וקבלו מחר – ${d.label}`;

  return (
    <div className="bg-ink px-4 py-1.5 text-center text-xs font-medium text-paper sm:text-sm">
      <span>🚚 {text}</span>
      <span className="mx-2 opacity-60">|</span>
      <span>משלוח חינם בהזמנה מעל {formatILS(DEFAULT_RULES.freeDeliveryThresholdAgorot)}</span>
    </div>
  );
}
