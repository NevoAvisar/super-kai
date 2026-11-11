import { DEFAULT_RULES, type StoreRules } from "./config";
import { getDeliveryDate, isValidDeliveryDate, type DateOnly } from "./delivery-date";
import { calculateCartTotals, lineTotal, type CartTotals, type FulfillmentType } from "./pricing";
import { isValidQuantity, type SaleUnit } from "./quantity";

/**
 * Server-side order validation. The browser cart is never trusted: prices,
 * quantity steps, the delivery fee and the delivery date are all recomputed
 * here from the catalog and the store rules.
 */
export interface CheckoutInput {
  items: { productId: string; quantity: number }[];
  fulfillment: FulfillmentType;
  deliveryDate: DateOnly;
  contact: { name: string; phone: string; email: string };
  address?: { city: string; street: string; houseNumber: string; apartment?: string; notes?: string };
}

export interface PricedProduct {
  id: string;
  name: string;
  saleUnit: SaleUnit;
  priceAgorot: number;
  listPriceAgorot: number;
  inStock: boolean;
}

export interface OrderDraft {
  lines: { productId: string; name: string; saleUnit: SaleUnit; quantity: number; unitPriceAgorot: number; lineTotalAgorot: number }[];
  totals: CartTotals;
  fulfillment: FulfillmentType;
  deliveryDate: DateOnly;
}

export type CheckoutResult =
  | { ok: true; order: OrderDraft }
  | { ok: false; errors: Record<string, string>; deliveryDate: DateOnly };

const PHONE = /^0(5\d|[2-489]|7\d)-?\d{7}$/; // Israeli mobile / landline
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCheckout(
  input: CheckoutInput,
  catalog: PricedProduct[],
  now: Date = new Date(),
  rules: StoreRules = DEFAULT_RULES,
): CheckoutResult {
  const errors: Record<string, string> = {};
  const byId = new Map(catalog.map((p) => [p.id, p]));

  // Items: exist, in stock, quantity on the 0.25 kg / 1 unit grid
  const lines: OrderDraft["lines"] = [];
  for (const it of input.items) {
    const p = byId.get(it.productId);
    if (!p) { errors.items = "חלק מהמוצרים בסל כבר לא זמינים. רעננו את הסל."; continue; }
    if (!p.inStock) { errors.items = `${p.name} אזל מהמלאי.`; continue; }
    if (!isValidQuantity(it.quantity, p.saleUnit)) {
      errors.items = `כמות לא תקינה עבור ${p.name} (${p.saleUnit === "KG" ? "בקפיצות של 0.25 ק״ג" : "ביחידות שלמות"}).`;
      continue;
    }
    lines.push({
      productId: p.id,
      name: p.name,
      saleUnit: p.saleUnit,
      quantity: it.quantity,
      unitPriceAgorot: p.priceAgorot,
      lineTotalAgorot: lineTotal(p.priceAgorot, it.quantity, p.saleUnit),
    });
  }
  if (!input.items.length) errors.items = "הסל ריק.";

  // Delivery date: must equal the date the 14:30 rule gives right now
  const expected = getDeliveryDate(now, rules);
  if (!isValidDeliveryDate(input.deliveryDate, now, rules)) {
    errors.deliveryDate = "תאריך האספקה התעדכן (עברה שעת הסגירה 14:30). בדקו את התאריך החדש ואשרו שוב.";
  }

  // Contact & address
  if (input.contact.name.trim().length < 2) errors.name = "נא למלא שם מלא.";
  if (!PHONE.test(input.contact.phone.replace(/\s/g, ""))) errors.phone = "מספר טלפון לא תקין.";
  if (!EMAIL.test(input.contact.email.trim())) errors.email = "כתובת מייל לא תקינה.";
  if (input.fulfillment === "DELIVERY") {
    const a = input.address;
    if (!a?.city.trim()) errors.city = "נא למלא עיר.";
    if (!a?.street.trim()) errors.street = "נא למלא רחוב.";
    if (!a?.houseNumber.trim()) errors.houseNumber = "נא למלא מספר בית.";
  }

  const totals = calculateCartTotals(
    lines.map((l) => ({ unitPriceAgorot: l.unitPriceAgorot, listPriceAgorot: byId.get(l.productId)!.listPriceAgorot, quantity: l.quantity, saleUnit: l.saleUnit })),
    input.fulfillment,
    rules,
  );
  if (!totals.meetsMinimumOrder) errors.items = "ההזמנה מתחת לסכום המינימום.";

  if (Object.keys(errors).length) return { ok: false, errors, deliveryDate: expected };
  return { ok: true, order: { lines, totals, fulfillment: input.fulfillment, deliveryDate: expected } };
}
