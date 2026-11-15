import type { CatalogProduct } from "./catalog";
import type { PortionGroup } from "@/data/catalog-seed";
import type { CartTotals, FulfillmentType, PromotionLike } from "./pricing";
import { applyPromotion, isPromotionLive, pricePer100g } from "./pricing";
import type { DateOnly } from "./delivery-date";
import type { CustomerAddress } from "./il-address/validate";
import type { SaleUnit } from "./quantity";

/**
 * LOCAL ADMIN DATA — the no-database stand-in for the admin dashboard.
 *
 * How it layers on the catalog
 * ----------------------------
 * The server always renders the base catalog (src/lib/catalog.ts: the seed file
 * in mock mode). Everything the admin changes is stored in this browser's
 * localStorage (src/store/admin.ts) as three small pieces:
 *
 *   1. overrides  – per product id: name / price / stock status / active flag.
 *                   Only the fields the admin touched; the rest stays from the seed.
 *   2. added      – whole products created in the admin screen.
 *   3. promotions – shaped like the Prisma `Promotion` model. Promotions that
 *                   come with the seed (`promoPercent`) appear as built-in
 *                   promotions with the id "seed-<productId>"; a stored
 *                   promotion with the same id replaces the built-in one, which
 *                   is how the admin edits or disables it.
 *
 * `applyLocalAdmin()` merges these over the base catalog and re-prices every
 * product with the same rules as the database path (lib/pricing.ts: the best
 * live promotion wins). Client components call it through `useLiveCatalog()`
 * after hydration, and checkout sends the same data to the server action so the
 * order is priced from the catalog the customer actually saw.
 *
 * None of this is secure or shared: it lives in one browser, anyone can edit it
 * from dev tools, and other visitors never see it. With a real backend these
 * become Product / Promotion / Order rows written by authenticated admin
 * server actions, and this overlay is deleted.
 */

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
export type PromotionType = PromotionLike["type"];
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "IN_PREPARATION"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export interface ProductOverride {
  name?: string;
  priceAgorot?: number;
  stockStatus?: StockStatus;
  isActive?: boolean;
}

/** A product created in the admin screen (not part of the seed). */
export interface LocalProduct {
  id: string;
  name: string;
  description: string | null;
  categorySlug: string;
  categoryIcon: string | null;
  portionGroup: PortionGroup;
  saleUnit: SaleUnit;
  priceAgorot: number;
  unitWeightGrams: number | null;
  unitLabel: string | null;
  stockStatus: StockStatus;
  isActive: boolean;
}

/** Mirrors the Prisma `Promotion` model; dates are ISO strings, categoryId is the category slug. */
export interface LocalPromotion {
  id: string;
  title: string;
  type: PromotionType;
  /** PERCENT_OFF: percent. AMOUNT_OFF / FIXED_PRICE: agorot. */
  value: number;
  productId: string | null;
  categoryId: string | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
}

export interface LocalAdminData {
  overrides: Record<string, ProductOverride>;
  added: LocalProduct[];
  promotions: LocalPromotion[];
}

export const EMPTY_ADMIN_DATA: LocalAdminData = { overrides: {}, added: [], promotions: [] };

/** Mirrors the Prisma `Order` + `OrderItem` snapshot. */
export interface LocalOrder {
  id: string;
  orderNumber: number;
  /** Email of the signed-in account that placed it; null for a guest. */
  userEmail: string | null;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  deliveryDate: DateOnly;
  createdAt: string;
  contact: { name: string; phone: string; email: string };
  address: { city: string; street: string; houseNumber: string; apartment?: string; notes?: string } | null;
  lines: { productId: string; name: string; saleUnit: SaleUnit; quantity: number; unitPriceAgorot: number; lineTotalAgorot: number }[];
  totals: Pick<CartTotals, "subtotalAgorot" | "savingsAgorot" | "deliveryFeeAgorot" | "totalAgorot">;
  /** Generated sample order (lib/demo-orders.ts), removable from the overview screen. */
  isDemo?: boolean;
}

export const STOCK_LABEL: Record<StockStatus, string> = {
  IN_STOCK: "במלאי",
  LOW_STOCK: "מלאי נמוך",
  OUT_OF_STOCK: "אזל",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  // No payment step in the mock: a new order waits for the admin to approve it.
  PENDING_PAYMENT: "ממתינה לאישור",
  CONFIRMED: "התקבלה",
  IN_PREPARATION: "בהכנה",
  READY: "מוכנה",
  OUT_FOR_DELIVERY: "יצאה למשלוח",
  COMPLETED: "נמסרה",
  CANCELLED: "בוטלה",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];

/** A catalog row as the admin sees it: includes hidden products and the raw status. */
export interface AdminProduct extends CatalogProduct {
  stockStatus: StockStatus;
  isActive: boolean;
  /** Created in the admin screen. */
  isLocal: boolean;
  /** A seed product with at least one local change. */
  isModified: boolean;
}

const SEED_PROMO_START = "2020-01-01T00:00:00.000Z";

/** The promotions baked into the base catalog, as editable Promotion records. */
export function builtInPromotions(base: CatalogProduct[]): LocalPromotion[] {
  return base
    .filter((p) => p.priceAgorot < p.listPriceAgorot)
    .map((p) => {
      const percent = Math.round((1 - p.priceAgorot / p.listPriceAgorot) * 100);
      // Keep the exact base price when a whole percent doesn't reproduce it.
      const exact = Math.round(p.listPriceAgorot * (1 - percent / 100)) === p.priceAgorot;
      return {
        id: `seed-${p.id}`,
        title: p.promoLabel ?? "מבצע",
        type: exact ? ("PERCENT_OFF" as const) : ("FIXED_PRICE" as const),
        value: exact ? percent : p.priceAgorot,
        productId: p.id,
        categoryId: null,
        startsAt: SEED_PROMO_START,
        endsAt: null,
        isActive: true,
      };
    });
}

/** Built-in promotions (unless replaced by a stored one with the same id) followed by the stored ones. */
export function allPromotions(base: CatalogProduct[], data: LocalAdminData): LocalPromotion[] {
  const stored = new Set(data.promotions.map((p) => p.id));
  return [...builtInPromotions(base).filter((p) => !stored.has(p.id)), ...data.promotions];
}

export function isBuiltInPromotion(id: string): boolean {
  return id.startsWith("seed-");
}

export type PromotionPhase = "live" | "scheduled" | "ended" | "disabled";

export function promotionPhase(p: LocalPromotion, now: Date = new Date()): PromotionPhase {
  if (!p.isActive) return "disabled";
  if (new Date(p.startsAt) > now) return "scheduled";
  if (p.endsAt && new Date(p.endsAt) <= now) return "ended";
  return "live";
}

const toLike = (p: LocalPromotion): PromotionLike => ({
  type: p.type,
  value: p.value,
  startsAt: new Date(p.startsAt),
  endsAt: p.endsAt ? new Date(p.endsAt) : null,
  isActive: p.isActive,
});

/** Every product (hidden ones included) with overrides and live promotions applied. */
export function adminProducts(base: CatalogProduct[], data: LocalAdminData, now: Date = new Date()): AdminProduct[] {
  const promos = allPromotions(base, data);

  const rows: Omit<AdminProduct, "priceAgorot" | "pricePer100gAgorot" | "promoLabel">[] = [
    ...base.map((p) => {
      const o = data.overrides[p.id] ?? {};
      const stockStatus = o.stockStatus ?? (p.inStock ? "IN_STOCK" : "OUT_OF_STOCK");
      return {
        ...p,
        name: o.name ?? p.name,
        listPriceAgorot: o.priceAgorot ?? p.listPriceAgorot,
        stockStatus,
        inStock: stockStatus !== "OUT_OF_STOCK",
        lowStock: stockStatus === "LOW_STOCK",
        isActive: o.isActive ?? true,
        isLocal: false,
        isModified: Object.keys(o).length > 0,
      };
    }),
    ...data.added.map((p) => ({
      id: p.id,
      slug: p.id,
      name: p.name,
      description: p.description,
      imageUrl: null,
      imageCredit: null,
      categorySlug: p.categorySlug,
      categoryIcon: p.categoryIcon,
      portionGroup: p.portionGroup,
      saleUnit: p.saleUnit,
      unitWeightGrams: p.unitWeightGrams,
      unitLabel: p.unitLabel,
      hasBones: false,
      listPriceAgorot: p.priceAgorot,
      inStock: p.stockStatus !== "OUT_OF_STOCK",
      lowStock: p.stockStatus === "LOW_STOCK",
      isFeatured: false,
      dietary: [],
      stockStatus: p.stockStatus,
      isActive: p.isActive,
      isLocal: true,
      isModified: false,
    })),
  ];

  return rows.map((p) => {
    // Best (lowest) price among the live promotions on the product or its category.
    let price = p.listPriceAgorot;
    let promoLabel: string | null = null;
    for (const promo of promos) {
      if (promo.productId !== p.id && promo.categoryId !== p.categorySlug) continue;
      const like = toLike(promo);
      if (!isPromotionLive(like, now)) continue;
      const candidate = applyPromotion(p.listPriceAgorot, like);
      if (candidate < price) {
        price = candidate;
        promoLabel = promo.title;
      }
    }
    return { ...p, priceAgorot: price, pricePer100gAgorot: pricePer100g(price, p.saleUnit, p.unitWeightGrams), promoLabel };
  });
}

/** The public catalog: the admin view without hidden products and admin-only fields. */
export function applyLocalAdmin(base: CatalogProduct[], data: LocalAdminData, now: Date = new Date()): CatalogProduct[] {
  return adminProducts(base, data, now)
    .filter((p) => p.isActive)
    .map(({ stockStatus: _s, isActive: _a, isLocal: _l, isModified: _m, ...product }) => product);
}

/** True when nothing was changed locally, so the base catalog can be used as is. */
export function isEmptyAdminData(data: LocalAdminData): boolean {
  return !Object.keys(data.overrides).length && !data.added.length && !data.promotions.length;
}

/** Orders that belong to an account: placed while signed in, or as a guest with the same email. */
export function ordersForUser(orders: LocalOrder[], email: string): LocalOrder[] {
  const mine = email.trim().toLowerCase();
  return orders
    .filter((o) => o.userEmail === mine || o.contact.email.trim().toLowerCase() === mine)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface OrderDay {
  date: DateOnly;
  orders: LocalOrder[];
  /** Kitchen summary: quantity per product over the day's non-cancelled orders. */
  summary: { productId: string; name: string; saleUnit: SaleUnit; quantity: number }[];
  totalAgorot: number;
}

/** Orders grouped by delivery date: today and upcoming days first (soonest on top), then past days. */
export function groupOrdersByDeliveryDate(orders: LocalOrder[], today: DateOnly): OrderDay[] {
  const byDate = new Map<DateOnly, LocalOrder[]>();
  for (const o of orders) byDate.set(o.deliveryDate, [...(byDate.get(o.deliveryDate) ?? []), o]);

  const days = [...byDate.entries()].map(([date, list]) => {
    const live = list.filter((o) => o.status !== "CANCELLED");
    const summary = new Map<string, OrderDay["summary"][number]>();
    for (const o of live) {
      for (const l of o.lines) {
        const row = summary.get(l.productId) ?? { productId: l.productId, name: l.name, saleUnit: l.saleUnit, quantity: 0 };
        row.quantity = Math.round((row.quantity + l.quantity) * 100) / 100;
        summary.set(l.productId, row);
      }
    }
    return {
      date,
      orders: [...list].sort((a, b) => a.orderNumber - b.orderNumber),
      summary: [...summary.values()].sort((a, b) => a.name.localeCompare(b.name, "he")),
      totalAgorot: live.reduce((sum, o) => sum + o.totals.totalAgorot, 0),
    };
  });

  const upcoming = days.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = days.filter((d) => d.date < today).sort((a, b) => b.date.localeCompare(a.date));
  return [...upcoming, ...past];
}

/** A customer as the admin sees them: a registered account, a guest who ordered, or both. */
export interface AdminCustomer {
  email: string;
  name: string;
  phone: string | null;
  /** City of the account's address, else of the most recent delivery address. */
  city: string | null;
  /** The verified address on the account, if one was entered. */
  address: CustomerAddress | null;
  /** Has an account (can sign in); false for a guest known only from an order. */
  registered: boolean;
  orders: LocalOrder[];
  /** Sum of the non-cancelled orders. */
  totalAgorot: number;
  lastOrderAt: string | null;
}

/** Registered accounts merged with everyone who placed an order, most recent buyers first. */
export function buildCustomers(
  accounts: { email: string; name: string; phone?: string; address?: CustomerAddress }[],
  orders: LocalOrder[],
): AdminCustomer[] {
  const byEmail = new Map<string, AdminCustomer>();
  const key = (email: string) => email.trim().toLowerCase();

  for (const a of accounts) {
    byEmail.set(key(a.email), { email: key(a.email), name: a.name, phone: a.phone ?? null, city: a.address?.city ?? null, address: a.address ?? null, registered: true, orders: [], totalAgorot: 0, lastOrderAt: null });
  }
  for (const o of [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const email = key(o.userEmail ?? o.contact.email);
    const c = byEmail.get(email) ?? { email, name: o.contact.name, phone: null, city: null, address: null, registered: false, orders: [], totalAgorot: 0, lastOrderAt: null };
    c.orders = [o, ...c.orders]; // newest first
    if (o.userEmail) c.registered = true; // ordered while signed in (e.g. a social login)
    c.phone ??= o.contact.phone || null;
    if (!c.address && o.address?.city.trim()) c.city = o.address.city.trim();
    if (o.status !== "CANCELLED") c.totalAgorot += o.totals.totalAgorot;
    c.lastOrderAt = o.createdAt;
    byEmail.set(email, c);
  }

  return [...byEmail.values()].sort(
    (a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? "") || a.name.localeCompare(b.name, "he"),
  );
}
