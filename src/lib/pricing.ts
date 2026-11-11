import { DEFAULT_RULES, type StoreRules } from "./config";
import { toSteps, stepFor, type SaleUnit } from "./quantity";

export type FulfillmentType = "PICKUP" | "DELIVERY";

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export interface PromotionLike {
  type: "PERCENT_OFF" | "AMOUNT_OFF" | "FIXED_PRICE";
  value: number;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
}

export function isPromotionLive(p: PromotionLike, now: Date = new Date()): boolean {
  return p.isActive && p.startsAt <= now && (p.endsAt === null || p.endsAt > now);
}

/** Unit price after a single promotion (never below 0, never above list price). */
export function applyPromotion(listPriceAgorot: number, p: PromotionLike): number {
  let price: number;
  switch (p.type) {
    case "PERCENT_OFF":
      price = Math.round(listPriceAgorot * (1 - p.value / 100));
      break;
    case "AMOUNT_OFF":
      price = listPriceAgorot - p.value;
      break;
    case "FIXED_PRICE":
      price = p.value;
      break;
  }
  return Math.min(listPriceAgorot, Math.max(0, price));
}

/** Best (lowest) price among all live promotions for a product. */
export function getEffectivePrice(
  listPriceAgorot: number,
  promotions: PromotionLike[],
  now: Date = new Date(),
): number {
  return promotions
    .filter((p) => isPromotionLive(p, now))
    .reduce((best, p) => Math.min(best, applyPromotion(listPriceAgorot, p)), listPriceAgorot);
}

// ---------------------------------------------------------------------------
// Line & cart totals
// ---------------------------------------------------------------------------

/** price × quantity, computed in integer steps and rounded to the nearest agora. */
export function lineTotal(unitPriceAgorot: number, quantity: number, unit: SaleUnit): number {
  const steps = toSteps(quantity, unit);
  return Math.round(unitPriceAgorot * steps * stepFor(unit));
}

export interface CartLine {
  unitPriceAgorot: number; // effective (after promotion)
  listPriceAgorot?: number; // before promotion, used to report savings
  quantity: number;
  saleUnit: SaleUnit;
}

/**
 * Delivery fee rule:
 *   • PICKUP                         → always free
 *   • DELIVERY, subtotal ≥ 150 ₪     → free
 *   • DELIVERY, subtotal  < 150 ₪    → deliveryFeeAgorot
 */
export function calculateDeliveryFee(
  subtotalAgorot: number,
  fulfillment: FulfillmentType,
  rules: StoreRules = DEFAULT_RULES,
): number {
  if (fulfillment === "PICKUP") return 0;
  if (subtotalAgorot <= 0) return 0;
  return subtotalAgorot >= rules.freeDeliveryThresholdAgorot ? 0 : rules.deliveryFeeAgorot;
}

export interface CartTotals {
  subtotalAgorot: number;
  savingsAgorot: number;
  deliveryFeeAgorot: number;
  totalAgorot: number;
  /** How much more to add for free delivery (0 when already qualified). */
  amountToFreeDeliveryAgorot: number;
  qualifiesForFreeDelivery: boolean;
  meetsMinimumOrder: boolean;
  canCheckout: boolean;
}

export function calculateCartTotals(
  lines: CartLine[],
  fulfillment: FulfillmentType,
  rules: StoreRules = DEFAULT_RULES,
): CartTotals {
  let subtotalAgorot = 0;
  let listTotal = 0;
  for (const l of lines) {
    subtotalAgorot += lineTotal(l.unitPriceAgorot, l.quantity, l.saleUnit);
    listTotal += lineTotal(l.listPriceAgorot ?? l.unitPriceAgorot, l.quantity, l.saleUnit);
  }
  const deliveryFeeAgorot = calculateDeliveryFee(subtotalAgorot, fulfillment, rules);
  const qualifiesForFreeDelivery = subtotalAgorot >= rules.freeDeliveryThresholdAgorot;
  const meetsMinimumOrder = subtotalAgorot >= rules.minimumOrderAgorot;

  return {
    subtotalAgorot,
    savingsAgorot: listTotal - subtotalAgorot,
    deliveryFeeAgorot,
    totalAgorot: subtotalAgorot + deliveryFeeAgorot,
    amountToFreeDeliveryAgorot: Math.max(0, rules.freeDeliveryThresholdAgorot - subtotalAgorot),
    qualifiesForFreeDelivery,
    meetsMinimumOrder,
    canCheckout: subtotalAgorot > 0 && meetsMinimumOrder,
  };
}

// ---------------------------------------------------------------------------
// Price per 100 g (comparison price shown on every card)
// ---------------------------------------------------------------------------

/**
 * KG products: price per kg / 10.
 * UNIT products: needs the net weight of one unit (e.g. 400 g soup container);
 * returns null when unknown (e.g. a whole cake sold by the piece).
 */
export function pricePer100g(
  priceAgorot: number,
  saleUnit: SaleUnit,
  unitWeightGrams?: number | null,
): number | null {
  if (saleUnit === "KG") return Math.round(priceAgorot / 10);
  if (!unitWeightGrams || unitWeightGrams <= 0) return null;
  return Math.round((priceAgorot * 100) / unitWeightGrams);
}
