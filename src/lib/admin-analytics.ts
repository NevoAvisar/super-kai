import { DEFAULT_RULES } from "./config";
import { getZonedParts, type DateOnly } from "./delivery-date";
import type { AdminCustomer, LocalOrder, OrderStatus } from "./local-admin";
import type { SaleUnit } from "./quantity";

/**
 * Pure calculations behind the admin dashboard (KPIs, charts, kitchen prep,
 * delivery zones, customer tiers, product sales). They read the locally stored
 * orders today; with a database the same numbers come from SQL aggregates.
 *
 * Money and counts are attributed to an order's DELIVERY date, and cancelled
 * orders never count.
 */

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function todayDateOnly(now: Date = new Date()): DateOnly {
  const { year, month, day } = getZonedParts(now, DEFAULT_RULES.timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDays(date: DateOnly, days: number): DateOnly {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

const dayMonth = (date: DateOnly) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;
const MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

// ---------------------------------------------------------------------------
// Status groups (the three the owner tracks)
// ---------------------------------------------------------------------------

export type StatusGroup = "pending" | "open" | "delivered" | "cancelled";

export function statusGroup(status: OrderStatus): StatusGroup {
  if (status === "PENDING_PAYMENT") return "pending";
  if (status === "COMPLETED") return "delivered";
  if (status === "CANCELLED") return "cancelled";
  return "open";
}

export const STATUS_GROUP_LABEL: Record<Exclude<StatusGroup, "cancelled">, string> = {
  pending: "ממתינות לאישור",
  open: "פתוחות / בהכנה",
  delivered: "נמסרו",
};

/** Pending or open: still needs the kitchen's or the courier's attention. */
export const isActive = (o: LocalOrder) => statusGroup(o.status) === "pending" || statusGroup(o.status) === "open";
const counts = (o: LocalOrder) => o.status !== "CANCELLED";

export function statusBreakdown(orders: LocalOrder[]): Record<Exclude<StatusGroup, "cancelled">, number> {
  const out = { pending: 0, open: 0, delivered: 0 };
  for (const o of orders) {
    const g = statusGroup(o.status);
    if (g !== "cancelled") out[g] += 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Delivery zones
// ---------------------------------------------------------------------------

export interface Zone {
  id: string;
  label: string;
}

const ZONES: (Zone & { cities: string[] })[] = [
  { id: "south-dan", label: "חולון - בת ים - ראשון לציון", cities: ["חולון", "בת ים", "ראשון לציון", "ראשלצ", "אזור"] },
  { id: "tel-aviv", label: "תל אביב - גבעתיים - רמת גן", cities: ["תל אביב", "תל אביב יפו", "תל אביב-יפו", "יפו", "גבעתיים", "רמת גן", "בני ברק"] },
  { id: "modiin", label: "מודיעין והסביבה", cities: ["מודיעין", "מודיעין מכבים רעות", "מודיעין-מכבים-רעות", "מכבים", "רעות", "שוהם", "לפיד"] },
];
export const PICKUP_ZONE: Zone = { id: "pickup", label: "איסוף עצמי" };
export const OTHER_ZONE: Zone = { id: "other", label: "אזורים אחרים" };
export const ALL_ZONES: Zone[] = [...ZONES.map(({ id, label }) => ({ id, label })), OTHER_ZONE, PICKUP_ZONE];

/** Also folds the official spellings ("תל אביב - יפו", "מודיעין-מכבים-רעות") into the plain ones. */
const normalizeCity = (city: string) => city.replace(/["״'׳]/g, "").replace(/[-־–]/g, " ").replace(/\s+/g, " ").trim();

export function zoneForCity(city: string | null | undefined): Zone {
  if (!city?.trim()) return OTHER_ZONE;
  const c = normalizeCity(city);
  const zone = ZONES.find((z) => z.cities.includes(c));
  return zone ? { id: zone.id, label: zone.label } : OTHER_ZONE;
}

export function zoneOf(order: LocalOrder): Zone {
  return order.fulfillment === "PICKUP" ? PICKUP_ZONE : zoneForCity(order.address?.city);
}

export interface ZoneGroup {
  zone: Zone;
  orders: LocalOrder[];
  pending: number;
  open: number;
  /** Stops for the courier: distinct delivery addresses would be ideal; orders is the honest count here. */
  deliveries: number;
}

/** Orders grouped by delivery zone, busiest first; pickup always last. Empty zones are dropped. */
export function groupByZone(orders: LocalOrder[]): ZoneGroup[] {
  const groups = new Map<string, ZoneGroup>();
  for (const o of orders) {
    const zone = zoneOf(o);
    const g = groups.get(zone.id) ?? { zone, orders: [], pending: 0, open: 0, deliveries: 0 };
    g.orders.push(o);
    const s = statusGroup(o.status);
    if (s === "pending") g.pending += 1;
    if (s === "open") g.open += 1;
    if (o.fulfillment === "DELIVERY" && counts(o)) g.deliveries += 1;
    groups.set(zone.id, g);
  }
  return [...groups.values()].sort(
    (a, b) => Number(a.zone.id === "pickup") - Number(b.zone.id === "pickup") || b.orders.length - a.orders.length,
  );
}

// ---------------------------------------------------------------------------
// KPIs and trend
// ---------------------------------------------------------------------------

export type Period = "day" | "week" | "month";
export const PERIOD_LABEL: Record<Period, string> = { day: "יומי", week: "שבועי", month: "חודשי" };
export const PERIOD_DAYS: Record<Period, number> = { day: 1, week: 7, month: 30 };

export interface PeriodTotals {
  revenueAgorot: number;
  deliveries: number;
  orders: number;
}

function totalsBetween(orders: LocalOrder[], from: DateOnly, to: DateOnly): PeriodTotals {
  const out = { revenueAgorot: 0, deliveries: 0, orders: 0 };
  for (const o of orders) {
    if (!counts(o) || o.deliveryDate < from || o.deliveryDate > to) continue;
    out.revenueAgorot += o.totals.totalAgorot;
    out.orders += 1;
    if (o.fulfillment === "DELIVERY") out.deliveries += 1;
  }
  return out;
}

/** Totals for the period ending today (1 / 7 / 30 days) and for the same-length period before it. */
export function periodKpis(orders: LocalOrder[], period: Period, today: DateOnly): { current: PeriodTotals; previous: PeriodTotals } {
  const days = PERIOD_DAYS[period];
  return {
    current: totalsBetween(orders, addDays(today, -(days - 1)), today),
    previous: totalsBetween(orders, addDays(today, -(2 * days - 1)), addDays(today, -days)),
  };
}

/** Change vs the previous period in percent; null when there is nothing to compare with. */
export function trendPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export interface TrendBucket extends PeriodTotals {
  key: string;
  /** Short axis label. */
  label: string;
  /** Full label for the tooltip. */
  title: string;
}

/** Buckets for the trend charts: the last 14 days, 8 weeks or 6 calendar months, oldest first. */
export function trendSeries(orders: LocalOrder[], period: Period, today: DateOnly): TrendBucket[] {
  if (period === "day") {
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, i - 13);
      return { key: date, label: dayMonth(date), title: dayMonth(date), ...totalsBetween(orders, date, date) };
    });
  }
  if (period === "week") {
    return Array.from({ length: 8 }, (_, i) => {
      const to = addDays(today, -7 * (7 - i));
      const from = addDays(to, -6);
      return { key: from, label: dayMonth(from), title: `${dayMonth(from)} עד ${dayMonth(to)}`, ...totalsBetween(orders, from, to) };
    });
  }
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1;
  return Array.from({ length: 6 }, (_, i) => {
    const first = new Date(Date.UTC(year, month - (5 - i), 1));
    const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
    const from = first.toISOString().slice(0, 10);
    const name = MONTHS[first.getUTCMonth()];
    return { key: from, label: name, title: `${name} ${first.getUTCFullYear()}`, ...totalsBetween(orders, from, last.toISOString().slice(0, 10)) };
  });
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface RevenueShare {
  key: string;
  name: string;
  revenueAgorot: number;
  orders: number;
}

const customerKey = (o: LocalOrder) => (o.userEmail ?? o.contact.email).trim().toLowerCase();

/** Revenue per customer, highest first; everyone past `top` is folded into one "others" slice. */
export function customerRevenueShare(orders: LocalOrder[], top = 6): { slices: RevenueShare[]; totalAgorot: number } {
  const by = new Map<string, RevenueShare>();
  for (const o of orders) {
    if (!counts(o)) continue;
    const key = customerKey(o);
    const row = by.get(key) ?? { key, name: o.contact.name, revenueAgorot: 0, orders: 0 };
    row.revenueAgorot += o.totals.totalAgorot;
    row.orders += 1;
    by.set(key, row);
  }
  const sorted = [...by.values()].sort((a, b) => b.revenueAgorot - a.revenueAgorot || a.name.localeCompare(b.name, "he"));
  const rest = sorted.slice(top);
  const slices = sorted.slice(0, top);
  if (rest.length) {
    slices.push({
      key: "others",
      name: `${rest.length} לקוחות נוספים`,
      revenueAgorot: rest.reduce((n, r) => n + r.revenueAgorot, 0),
      orders: rest.reduce((n, r) => n + r.orders, 0),
    });
  }
  return { slices, totalAgorot: sorted.reduce((n, r) => n + r.revenueAgorot, 0) };
}

export type CustomerTier = "vip" | "regular" | "new";
export const TIER_LABEL: Record<CustomerTier, string> = { vip: "לקוח VIP", regular: "לקוח קבוע", new: "לקוח חדש" };

/** VIP: paid 2,000 ₪ or more, or 8+ orders. Regular: 2+ orders. Otherwise new. Cancelled orders don't count. */
export function customerTier(c: Pick<AdminCustomer, "orders" | "totalAgorot">): CustomerTier {
  const n = c.orders.filter(counts).length;
  if (c.totalAgorot >= 2000_00 || n >= 8) return "vip";
  return n >= 2 ? "regular" : "new";
}

/** The dishes a customer orders most often (by number of orders that include them). */
export function favoriteDishes(orders: LocalOrder[], top = 3): { productId: string; name: string; orders: number }[] {
  const by = new Map<string, { productId: string; name: string; orders: number }>();
  for (const o of orders) {
    if (!counts(o)) continue;
    for (const l of o.lines) {
      const row = by.get(l.productId) ?? { productId: l.productId, name: l.name, orders: 0 };
      row.orders += 1;
      by.set(l.productId, row);
    }
  }
  return [...by.values()].sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name, "he")).slice(0, top);
}

// ---------------------------------------------------------------------------
// Kitchen prep and product sales
// ---------------------------------------------------------------------------

/** Approved and not yet prepared: what the kitchen still has to cook. */
export const needsPrep = (o: LocalOrder) => o.status === "CONFIRMED" || o.status === "IN_PREPARATION";

export interface PrepRow {
  productId: string;
  name: string;
  saleUnit: SaleUnit;
  /** Total kg (KG products) or items (UNIT products) to prepare. */
  quantity: number;
  /** How many orders include this dish. */
  orders: number;
}

/** Total quantity per dish over the given orders (pass the day's approved orders), largest first. */
export function kitchenPrep(orders: LocalOrder[]): PrepRow[] {
  const by = new Map<string, PrepRow>();
  for (const o of orders) {
    for (const l of o.lines) {
      const row = by.get(l.productId) ?? { productId: l.productId, name: l.name, saleUnit: l.saleUnit, quantity: 0, orders: 0 };
      row.quantity = Math.round((row.quantity + l.quantity) * 100) / 100;
      row.orders += 1;
      by.set(l.productId, row);
    }
  }
  return [...by.values()].sort((a, b) => b.orders - a.orders || b.quantity - a.quantity || a.name.localeCompare(b.name, "he"));
}

export interface ProductSales {
  quantity: number;
  revenueAgorot: number;
  orders: number;
}

/** Quantity sold and revenue per product id over all non-cancelled orders. */
export function productSales(orders: LocalOrder[]): Map<string, ProductSales> {
  const by = new Map<string, ProductSales>();
  for (const o of orders) {
    if (!counts(o)) continue;
    for (const l of o.lines) {
      const row = by.get(l.productId) ?? { quantity: 0, revenueAgorot: 0, orders: 0 };
      row.quantity = Math.round((row.quantity + l.quantity) * 100) / 100;
      row.revenueAgorot += l.lineTotalAgorot;
      row.orders += 1;
      by.set(l.productId, row);
    }
  }
  return by;
}
