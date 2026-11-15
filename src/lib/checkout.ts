import type { AddressDataset } from "./il-address/dataset";
import { validateAddress, type AddressInput, type CustomerAddress } from "./il-address/validate";
import { DEFAULT_RULES, MAX_CART_LINES, type StoreRules } from "./config";
import { getDeliveryDate, isValidDeliveryDate, type DateOnly } from "./delivery-date";
import { calculateCartTotals, lineTotal, type CartTotals, type FulfillmentType } from "./pricing";
import { isValidQuantity, maxQuantityFor, type SaleUnit } from "./quantity";

/**
 * Server-side order validation. The browser cart is never trusted: prices,
 * quantity steps, the delivery fee and the delivery date are all recomputed
 * here from the catalog and the store rules, and a delivery address must be an
 * official city + a street of that city (lib/il-address).
 */
export type DeliveryAddress = CustomerAddress & { apartment?: string; notes?: string };

export interface CheckoutInput {
  items: { productId: string; quantity: number }[];
  fulfillment: FulfillmentType;
  deliveryDate: DateOnly;
  contact: { name: string; phone: string; email: string };
  address?: AddressInput & { apartment?: string; notes?: string };
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
  /** The verified address with its official names and codes; null for pickup. */
  address: DeliveryAddress | null;
}

export type CheckoutResult =
  | { ok: true; order: OrderDraft }
  | { ok: false; errors: Record<string, string>; deliveryDate: DateOnly };

const PHONE = /^0(5\d|[2-489]|7\d)-?\d{7}$/; // Israeli mobile / landline
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Max length of any free-text field (name, street, notes…). */
const MAX_TEXT = 300;

const str = (v: unknown): string => (typeof v === "string" ? v.slice(0, MAX_TEXT) : "");
const code = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) ? v : null);

/**
 * QA fix — runtime shape check for the server action.
 * EN: a Server Action is a public POST endpoint; its TypeScript types are not
 *     enforced at runtime. Before this, `{ contact: null }` or a non-array
 *     `items` crashed the action with a 500. Anything malformed now becomes a
 *     well-typed input that validateCheckout() rejects with normal errors.
 * HE: פעולת שרת היא נקודת קצה ציבורית – הטיפוסים לא נאכפים בזמן ריצה. קלט
 *     שבור גרם לקריסה (500). עכשיו הקלט מנורמל ונדחה עם הודעות שגיאה רגילות.
 */
export function normalizeCheckoutInput(raw: unknown): CheckoutInput {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const contact = (r.contact && typeof r.contact === "object" ? r.contact : {}) as Record<string, unknown>;
  const a = r.address && typeof r.address === "object" ? (r.address as Record<string, unknown>) : undefined;
  const items = Array.isArray(r.items) ? r.items.slice(0, MAX_CART_LINES + 1) : [];
  return {
    items: items.map((it) => {
      const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
      return { productId: str(o.productId), quantity: typeof o.quantity === "number" ? o.quantity : NaN };
    }),
    fulfillment: r.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY",
    deliveryDate: str(r.deliveryDate),
    contact: { name: str(contact.name), phone: str(contact.phone), email: str(contact.email) },
    address: a && {
      cityCode: code(a.cityCode),
      city: str(a.city),
      streetCode: code(a.streetCode),
      street: str(a.street),
      houseNumber: str(a.houseNumber),
      floor: str(a.floor),
      entrance: str(a.entrance),
      apartment: str(a.apartment),
      notes: str(a.notes),
    },
  };
}

export function validateCheckout(
  input: CheckoutInput,
  catalog: PricedProduct[],
  addresses: AddressDataset,
  now: Date = new Date(),
  rules: StoreRules = DEFAULT_RULES,
): CheckoutResult {
  const errors: Record<string, string> = {};
  const byId = new Map(catalog.map((p) => [p.id, p]));

  // Items: exist, in stock, quantity on the 0.25 kg / 1 unit grid
  const lines: OrderDraft["lines"] = [];
  const seen = new Set<string>();
  if (input.items.length > MAX_CART_LINES) errors.items = "יותר מדי פריטים בהזמנה אחת.";
  for (const it of input.items) {
    // QA: the same product twice would double-count in the kitchen summary.
    if (seen.has(it.productId)) { errors.items = "מוצר מופיע פעמיים בסל. רעננו את הסל."; continue; }
    seen.add(it.productId);
    const p = byId.get(it.productId);
    if (!p) { errors.items = "חלק מהמוצרים בסל כבר לא זמינים. רעננו את הסל."; continue; }
    if (!p.inStock) { errors.items = `${p.name} אזל מהמלאי.`; continue; }
    if (!isValidQuantity(it.quantity, p.saleUnit)) {
      errors.items = `כמות לא תקינה עבור ${p.name} (${p.saleUnit === "KG" ? "בקפיצות של 0.25 ק״ג" : "ביחידות שלמות"}).`;
      continue;
    }
    // QA: upper bound per line (the client stepper stops at the same cap).
    if (it.quantity > maxQuantityFor(p.saleUnit)) {
      errors.items = `הכמות של ${p.name} גבוהה מהמותר בהזמנה אונליין. להזמנות גדולות צרו קשר.`;
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
  let address: DeliveryAddress | null = null;
  if (input.fulfillment === "DELIVERY") {
    const checked = validateAddress(input.address ?? {}, addresses);
    if (!checked.ok) Object.assign(errors, checked.errors);
    else {
      const apartment = String(input.address?.apartment ?? "").trim().slice(0, 10);
      const notes = String(input.address?.notes ?? "").trim().slice(0, 200);
      address = { ...checked.address, ...(apartment && { apartment }), ...(notes && { notes }) };
    }
  }

  const totals = calculateCartTotals(
    lines.map((l) => ({ unitPriceAgorot: l.unitPriceAgorot, listPriceAgorot: byId.get(l.productId)!.listPriceAgorot, quantity: l.quantity, saleUnit: l.saleUnit })),
    input.fulfillment,
    rules,
  );
  if (!totals.meetsMinimumOrder) errors.items = "ההזמנה מתחת לסכום המינימום.";

  if (Object.keys(errors).length) return { ok: false, errors, deliveryDate: expected };
  return { ok: true, order: { lines, totals, fulfillment: input.fulfillment, deliveryDate: expected, address } };
}
