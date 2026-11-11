"use client";

import { formatQuantity, type SaleUnit } from "@/lib/quantity";

interface Props {
  quantity: number;
  saleUnit: SaleUnit;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md";
}

/** + [0.75 ק״ג] − — each click moves exactly one step (0.25 kg or one unit). */
export function QuantityStepper({ quantity, saleUnit, onIncrement, onDecrement, size = "md" }: Props) {
  const btn =
    "flex shrink-0 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-500 hover:text-white active:scale-95 " +
    (size === "sm" ? "h-7 w-7 text-base" : "h-9 w-9 text-xl");
  const step = saleUnit === "KG" ? "0.25 ק״ג" : "יחידה";
  return (
    <div className="flex items-center justify-between gap-1 rounded-full bg-paper p-1 ring-1 ring-brand-500/40">
      <button type="button" className={btn} onClick={onIncrement} aria-label={`הוספת ${step}`}>
        +
      </button>
      <span className="text-center text-sm font-bold tabular-nums" aria-live="polite">
        {formatQuantity(quantity, saleUnit)}
      </span>
      <button type="button" className={btn} onClick={onDecrement} aria-label={`הפחתת ${step}`}>
        −
      </button>
    </div>
  );
}
