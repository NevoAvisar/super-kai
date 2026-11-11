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
