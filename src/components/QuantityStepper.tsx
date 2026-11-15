"use client";

import { formatQuantity, maxQuantityFor, type SaleUnit } from "@/lib/quantity";

interface Props {
  quantity: number;
  saleUnit: SaleUnit;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md";
}

/** + [0.75 ק״ג] − — each click moves exactly one step (0.25 kg or one unit). */
export function QuantityStepper({ quantity, saleUnit, onIncrement, onDecrement, size = "md" }: Props) {
  const atMax = quantity >= maxQuantityFor(saleUnit);
  const btn =
    "flex shrink-0 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-500 hover:text-white active:scale-95 " +
    // QA (mobile): "sm" was 28px — under the ~36–44px touch minimum. It stays 36px on touch-size screens.
    (size === "sm" ? "h-9 w-9 text-base sm:h-8 sm:w-8" : "h-10 w-10 text-xl");
  const step = saleUnit === "KG" ? "0.25 ק״ג" : "יחידה";
  return (
    <div className="flex items-center justify-between gap-1 rounded-full bg-paper p-1 ring-1 ring-brand-500/40">
      <button type="button" className={`${btn} disabled:opacity-30 disabled:hover:bg-transparent`} onClick={onIncrement} disabled={atMax} aria-label={`הוספת ${step}`}>
        +
      </button>
      <span className="min-w-0 whitespace-nowrap text-center text-sm font-bold tabular-nums" aria-live="polite">
        {formatQuantity(quantity, saleUnit)}
      </span>
      <button type="button" className={btn} onClick={onDecrement} aria-label={`הפחתת ${step}`}>
        −
      </button>
    </div>
  );
}
