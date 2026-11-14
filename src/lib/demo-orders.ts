import { addDays, todayDateOnly } from "./admin-analytics";
import type { DateOnly } from "./delivery-date";
import type { LocalOrder, OrderStatus } from "./local-admin";
import { calculateCartTotals, lineTotal } from "./pricing";
import type { SaleUnit } from "./quantity";

/**
 * SAMPLE ORDERS for the admin dashboard, so the charts, kitchen totals,
 * delivery zones and customer ranking have something to show before real
 * orders exist. Every order is flagged `isDemo` and can be removed in one click
 * from the overview screen. The people, phones and addresses are invented.
 */

export interface DemoProduct {
  id: string;
  name: string;
  saleUnit: SaleUnit;
  priceAgorot: number;
  listPriceAgorot: number;
}

/** How many real orders make the sample data unnecessary. */
export const DEMO_THRESHOLD = 5;

const CUSTOMERS = [
  { name: "רונית אברהמי", city: "חולון", street: "סוקולוב", weight: 9 },
  { name: "יוסי מזרחי", city: "ראשון לציון", street: "הרצל", weight: 8 },
  { name: "משרד עו״ד לוי ושות׳", city: "תל אביב", street: "רוטשילד", weight: 7 },
  { name: "דנה כהן", city: "תל אביב", street: "דיזנגוף", weight: 5 },
  { name: "מיכל בן דוד", city: "בת ים", street: "בלפור", weight: 5 },
  { name: "אבי שושן", city: "מודיעין", street: "עמק זבולון", weight: 4 },
  { name: "נועה פרידמן", city: "גבעתיים", street: "כצנלסון", weight: 4 },
  { name: "אלון גולן", city: "רמת גן", street: "ביאליק", weight: 3 },
  { name: "שירה אוחיון", city: "חולון", street: "אילת", weight: 3 },
  { name: "תמר רוזן", city: "מודיעין", street: "יגאל ידין", weight: 2 },
  { name: "עידו ברק", city: "ראשון לציון", street: "ז׳בוטינסקי", weight: 2 },
  { name: "גלית סויסה", city: "בת ים", street: "העצמאות", weight: 2 },
  { name: "אורי שפירא", city: "פתח תקווה", street: "חיים עוזר", weight: 1 },
  { name: "ליאת מור", city: "רחובות", street: "הרצל", weight: 1 },
];

/** Small deterministic PRNG, so the sample set is the same on every machine. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick<T>(items: T[], weight: (item: T, index: number) => number, rnd: () => number): T {
  const total = items.reduce((n, it, i) => n + weight(it, i), 0);
  let r = rnd() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weight(items[i], i);
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const weekday = (date: DateOnly) => new Date(`${date}T12:00:00Z`).getUTCDay();

/** About 12 weeks of history plus today's and tomorrow's open orders. */
export function generateDemoOrders(products: DemoProduct[], now: Date = new Date()): LocalOrder[] {
  if (!products.length) return [];
  const rnd = mulberry32(20261114);
  const today = todayDateOnly(now);
  // The first few dishes sell far more than the long tail, as in a real kitchen.
  const menu = products;
  const orders: LocalOrder[] = [];
  let number = 800;

  for (let offset = -84; offset <= 1; offset++) {
    const date = addDays(today, offset);
    // Closed on Saturday, but today and tomorrow are always filled so the dashboard has live work to show.
    if (weekday(date) === 6 && offset < 0) continue;
    const busy = weekday(date) === 4 || weekday(date) === 5; // Thursday / Friday
    // Business grows slowly over the weeks; today and tomorrow are full days.
    const growth = 1 + (offset + 84) / 84;
    const count = offset >= 0 ? (offset === 0 ? 9 : 6) : Math.floor(rnd() * (busy ? 2.4 : 1.5) * growth);

    for (let k = 0; k < count; k++) {
      const customer = weightedPick(CUSTOMERS, (c) => c.weight, rnd);
      const index = CUSTOMERS.indexOf(customer);
      const lineCount = 2 + Math.floor(rnd() * 4);
      const picked = new Map<string, DemoProduct>();
      while (picked.size < Math.min(lineCount, menu.length)) {
        const p = weightedPick(menu, (_, i) => (i < 8 ? 9 : 1), rnd);
        picked.set(p.id, p);
      }
      const lines = [...picked.values()].map((p) => {
        const quantity = p.saleUnit === "KG" ? 0.25 * (1 + Math.floor(rnd() * 6)) : 1 + Math.floor(rnd() * 3);
        return {
          productId: p.id,
          name: p.name,
          saleUnit: p.saleUnit,
          quantity,
          unitPriceAgorot: p.priceAgorot,
          lineTotalAgorot: lineTotal(p.priceAgorot, quantity, p.saleUnit),
        };
      });
      const fulfillment = rnd() < 0.85 ? ("DELIVERY" as const) : ("PICKUP" as const);
      const totals = calculateCartTotals(
        lines.map((l) => ({ unitPriceAgorot: l.unitPriceAgorot, listPriceAgorot: picked.get(l.productId)!.listPriceAgorot, quantity: l.quantity, saleUnit: l.saleUnit })),
        fulfillment,
      );

      let status: OrderStatus;
      if (offset < 0) status = rnd() < 0.05 ? "CANCELLED" : "COMPLETED";
      else if (offset === 0) status = (["CONFIRMED", "IN_PREPARATION", "IN_PREPARATION", "CONFIRMED", "OUT_FOR_DELIVERY", "COMPLETED", "PENDING_PAYMENT"] as const)[k % 7];
      else status = k % 2 === 0 ? "PENDING_PAYMENT" : "CONFIRMED";

      number += 1;
      orders.push({
        id: `demo-${number}`,
        orderNumber: number,
        userEmail: null,
        status,
        fulfillment,
        deliveryDate: date,
        createdAt: `${addDays(date, -1)}T${String(8 + Math.floor(rnd() * 6)).padStart(2, "0")}:${String(Math.floor(rnd() * 60)).padStart(2, "0")}:00.000Z`,
        contact: { name: customer.name, phone: `050-55501${String(index + 10)}`, email: `customer${index + 1}@example.com` },
        address: fulfillment === "DELIVERY" ? { city: customer.city, street: customer.street, houseNumber: String(3 + index * 4) } : null,
        lines,
        totals: {
          subtotalAgorot: totals.subtotalAgorot,
          savingsAgorot: totals.savingsAgorot,
          deliveryFeeAgorot: totals.deliveryFeeAgorot,
          totalAgorot: totals.totalAgorot,
        },
        isDemo: true,
      });
    }
  }
  return orders;
}
