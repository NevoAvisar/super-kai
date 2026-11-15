import { KG_STEP, MAX_LINE_QUANTITY } from "./config";

export type SaleUnit = "KG" | "UNIT";

/**
 * Quantity math is done in integer "steps" (quarters of a kilo for KG products,
 * whole items for UNIT products) to avoid floating-point drift such as
 * 0.25 + 0.5 + 0.1 … ≠ expected.
 */
export function stepFor(unit: SaleUnit): number {
  return unit === "KG" ? KG_STEP : 1;
}

export function toSteps(quantity: number, unit: SaleUnit): number {
  return Math.round(quantity / stepFor(unit));
}

export function fromSteps(steps: number, unit: SaleUnit): number {
  // Round to 2 decimals so 3 * 0.25 is exactly 0.75.
  return Math.round(steps * stepFor(unit) * 100) / 100;
}

/** Largest quantity one cart line may hold (30 kg / 50 units by default). */
export function maxQuantityFor(unit: SaleUnit): number {
  return MAX_LINE_QUANTITY[unit];
}

/**
 * Next quantity after one "+" click. Never exceeds `max` (defaults to the
 * per-line cap) — QA fix: the stepper previously had no upper bound.
 * HE: תיקון QA – לסטפר לא הייתה תקרה, עכשיו הוא נעצר בתקרת השורה.
 */
export function incrementQuantity(current: number, unit: SaleUnit, max: number = maxQuantityFor(unit)): number {
  const next = fromSteps(toSteps(current, unit) + 1, unit);
  return next > max ? current : next;
}

/** Next quantity after one "−" click. Returns 0 when the item should be removed. */
export function decrementQuantity(current: number, unit: SaleUnit): number {
  return fromSteps(Math.max(0, toSteps(current, unit) - 1), unit);
}

/** Server-side guard: quantity must be positive and an exact multiple of the step. */
export function isValidQuantity(quantity: number, unit: SaleUnit): boolean {
  if (!Number.isFinite(quantity) || quantity <= 0) return false;
  const steps = quantity / stepFor(unit);
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

export function formatQuantity(quantity: number, unit: SaleUnit): string {
  if (unit === "UNIT") return `${quantity} יח׳`;
  return `${quantity.toFixed(2)} ק״ג`;
}
