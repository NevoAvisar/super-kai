/**
 * Business rules for Super-Kai. These are the defaults; in production they are
 * loaded from the StoreSettings table (editable by Kai in the admin dashboard)
 * and passed into the pure functions below, which makes them easy to test.
 */
export interface StoreRules {
  /** Orders at or above this subtotal get free delivery. */
  freeDeliveryThresholdAgorot: number;
  /** Fee charged on DELIVERY orders below the threshold. */
  deliveryFeeAgorot: number;
  /** Hard minimum for any order (0 = no minimum). See README "Open decisions". */
  minimumOrderAgorot: number;
  /** Orders placed at or after this local time ship one day later. */
  cutoffHour: number;
  cutoffMinute: number;
  /** 0 = Sunday … 6 = Saturday. No deliveries/pickups on these days. */
  closedWeekdays: number[];
  timeZone: string;
}

export const DEFAULT_RULES: StoreRules = {
  freeDeliveryThresholdAgorot: 150_00, // 150 ₪
  deliveryFeeAgorot: 25_00, // 25 ₪ (placeholder until Kai sets the real fee)
  minimumOrderAgorot: 0,
  cutoffHour: 14,
  cutoffMinute: 30,
  closedWeekdays: [6], // Saturday
  timeZone: "Asia/Jerusalem",
};

/** Quantity step for products sold by weight. */
export const KG_STEP = 0.25;

/**
 * QA: upper bound per cart line (anti-abuse / fat-finger guard).
 * EN: the stepper stops here and the server rejects anything larger.
 * HE: תקרה לשורה בסל – הסטפר נעצר כאן והשרת דוחה כמות גדולה יותר.
 */
export const MAX_LINE_QUANTITY = { KG: 30, UNIT: 50 } as const;
/** QA: a cart can't hold more than this many distinct lines (server guard). */
export const MAX_CART_LINES = 100;

/** "14:30" — the cut-off as shown to customers (keeps banner, footer and cart copy in sync with the rules). */
export function cutoffLabel(rules: StoreRules = DEFAULT_RULES): string {
  return `${rules.cutoffHour}:${String(rules.cutoffMinute).padStart(2, "0")}`;
}
