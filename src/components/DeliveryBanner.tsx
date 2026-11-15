"use client";

import { cutoffLabel, DEFAULT_RULES } from "@/lib/config";
import { formatILS } from "@/lib/money";
import { formatCountdown, useDeliveryDate } from "@/lib/use-delivery-date";

export function DeliveryBanner() {
  const d = useDeliveryDate();
  const text = !d
    ? "מזמינים היום – מקבלים מחר"
    : d.pastCutoff
      ? `ההזמנות להיום נסגרו ב-${cutoffLabel()} · הזמנה עכשיו תסופק ב${d.label}`
      : `הזמינו בתוך ${formatCountdown(d.minutesToCutoff!)} וקבלו מחר – ${d.label}`;

  return (
    <div className="bg-ink px-4 py-1.5 text-center text-xs font-medium text-paper sm:text-sm">
      <span>🚚 {text}</span>
      {/* QA (mobile): on phones the two messages stack instead of wrapping mid-sentence around the "|". */}
      <span className="mx-2 hidden opacity-60 sm:inline">|</span>
      <span className="block sm:inline">משלוח חינם בהזמנה מעל {formatILS(DEFAULT_RULES.freeDeliveryThresholdAgorot)}</span>
    </div>
  );
}
