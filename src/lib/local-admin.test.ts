import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "./catalog";
import {
  adminProducts,
  allPromotions,
  applyLocalAdmin,
  builtInPromotions,
  EMPTY_ADMIN_DATA,
  groupOrdersByDeliveryDate,
  ordersForUser,
  promotionPhase,
  type LocalAdminData,
  type LocalOrder,
  type LocalPromotion,
} from "./local-admin";

const product = (id: string, over: Partial<CatalogProduct> = {}): CatalogProduct => ({
  id,
  slug: id,
  name: id,
  description: null,
  imageUrl: null,
  imageCredit: null,
  categorySlug: "mains",
  categoryIcon: null,
  portionGroup: "MAINS",
  saleUnit: "KG",
  unitWeightGrams: null,
  unitLabel: null,
  hasBones: false,
  listPriceAgorot: 100_00,
  priceAgorot: 100_00,
  pricePer100gAgorot: 10_00,
  promoLabel: null,
  inStock: true,
  isFeatured: false,
  dietary: [],
  ...over,
});

const base = [
  product("schnitzel"),
  product("salmon", { priceAgorot: 85_00, pricePer100gAgorot: 8_50, promoLabel: "15% הנחה" }),
  product("soup", { categorySlug: "soups", saleUnit: "UNIT", unitWeightGrams: 400, listPriceAgorot: 32_00, priceAgorot: 32_00, pricePer100gAgorot: 8_00 }),
];

const now = new Date("2026-11-13T10:00:00Z");
const promo = (over: Partial<LocalPromotion>): LocalPromotion => ({
  id: "p1",
  title: "מבצע",
  type: "PERCENT_OFF",
  value: 10,
  productId: null,
  categoryId: null,
  startsAt: "2026-11-01T00:00:00Z",
  endsAt: null,
  isActive: true,
  ...over,
});
const data = (over: Partial<LocalAdminData>): LocalAdminData => ({ ...EMPTY_ADMIN_DATA, ...over });

describe("applyLocalAdmin", () => {
  it("leaves the catalog unchanged when nothing was edited", () => {
    expect(applyLocalAdmin(base, EMPTY_ADMIN_DATA, now)).toEqual(base.map((p) => ({ ...p, lowStock: false })));
  });

  it("applies name, price and stock overrides and re-derives the 100 g price", () => {
    const [p] = applyLocalAdmin(base, data({ overrides: { schnitzel: { name: "שניצל", priceAgorot: 120_00, stockStatus: "LOW_STOCK" } } }), now);
    expect(p).toMatchObject({ name: "שניצל", listPriceAgorot: 120_00, priceAgorot: 120_00, pricePer100gAgorot: 12_00, inStock: true, lowStock: true });
  });

  it("hides inactive products from the public catalog but keeps them for the admin", () => {
    const d = data({ overrides: { schnitzel: { isActive: false } } });
    expect(applyLocalAdmin(base, d, now).map((p) => p.id)).toEqual(["salmon", "soup"]);
    expect(adminProducts(base, d, now).find((p) => p.id === "schnitzel")).toMatchObject({ isActive: false, isModified: true });
  });

  it("re-applies the built-in promotion on top of an overridden price", () => {
    const salmon = applyLocalAdmin(base, data({ overrides: { salmon: { priceAgorot: 200_00 } } }), now).find((p) => p.id === "salmon")!;
    expect(salmon).toMatchObject({ listPriceAgorot: 200_00, priceAgorot: 170_00, promoLabel: "15% הנחה" });
  });

  it("lets the admin disable a built-in promotion", () => {
    const [seed] = builtInPromotions(base);
    expect(seed).toMatchObject({ id: "seed-salmon", type: "PERCENT_OFF", value: 15 });
    const d = data({ promotions: [{ ...seed, isActive: false }] });
    expect(allPromotions(base, d)).toHaveLength(1);
    expect(applyLocalAdmin(base, d, now).find((p) => p.id === "salmon")).toMatchObject({ priceAgorot: 100_00, promoLabel: null });
  });

  it("applies a category promotion to every product in it, and the best price wins", () => {
    const d = data({
      promotions: [
        promo({ id: "cat", title: "שבוע עיקריות", categoryId: "mains", value: 20 }),
        promo({ id: "one", title: "מחיר מיוחד", productId: "schnitzel", type: "FIXED_PRICE", value: 70_00 }),
      ],
    });
    const out = applyLocalAdmin(base, d, now);
    expect(out.find((p) => p.id === "schnitzel")).toMatchObject({ priceAgorot: 70_00, promoLabel: "מחיר מיוחד" });
    expect(out.find((p) => p.id === "salmon")).toMatchObject({ priceAgorot: 80_00, promoLabel: "שבוע עיקריות" });
    expect(out.find((p) => p.id === "soup")).toMatchObject({ priceAgorot: 32_00, promoLabel: null });
  });

  it("ignores promotions outside their date window", () => {
    const future = promo({ productId: "schnitzel", startsAt: "2026-12-01T00:00:00Z" });
    const past = promo({ id: "p2", productId: "schnitzel", endsAt: "2026-11-10T00:00:00Z" });
    expect(promotionPhase(future, now)).toBe("scheduled");
    expect(promotionPhase(past, now)).toBe("ended");
    expect(applyLocalAdmin(base, data({ promotions: [future, past] }), now)[0].priceAgorot).toBe(100_00);
  });

  it("appends products added by the admin", () => {
    const d = data({
      added: [{
        id: "local-1", name: "קציצות", description: null, categorySlug: "mains", categoryIcon: "🍖", portionGroup: "MAINS",
        saleUnit: "KG", priceAgorot: 90_00, unitWeightGrams: null, unitLabel: null, stockStatus: "IN_STOCK", isActive: true,
      }],
      promotions: [promo({ categoryId: "mains" })],
    });
    expect(applyLocalAdmin(base, d, now).find((p) => p.id === "local-1")).toMatchObject({ name: "קציצות", listPriceAgorot: 90_00, priceAgorot: 81_00, inStock: true });
  });
});

const order = (n: number, over: Partial<LocalOrder> = {}): LocalOrder => ({
  id: `o${n}`,
  orderNumber: n,
  userEmail: null,
  status: "CONFIRMED",
  fulfillment: "PICKUP",
  deliveryDate: "2026-11-15",
  createdAt: `2026-11-13T10:0${n % 10}:00.000Z`,
  contact: { name: "דנה", phone: "0501234567", email: "dana@example.com" },
  address: null,
  lines: [{ productId: "schnitzel", name: "שניצל", saleUnit: "KG", quantity: 0.75, unitPriceAgorot: 100_00, lineTotalAgorot: 75_00 }],
  totals: { subtotalAgorot: 75_00, savingsAgorot: 0, deliveryFeeAgorot: 0, totalAgorot: 75_00 },
  ...over,
});

describe("orders", () => {
  it("matches a user's orders by account or by contact email, newest first", () => {
    const orders = [order(1, { userEmail: "dana@example.com" }), order(2, { contact: { name: "א", phone: "0", email: "Other@example.com" } }), order(3)];
    expect(ordersForUser(orders, "dana@example.com").map((o) => o.orderNumber)).toEqual([3, 1]);
    expect(ordersForUser(orders, "other@example.com").map((o) => o.orderNumber)).toEqual([2]);
  });

  it("groups by delivery date: upcoming days first, past days last, with a kitchen summary", () => {
    const days = groupOrdersByDeliveryDate(
      [order(1), order(2), order(3, { status: "CANCELLED" }), order(4, { deliveryDate: "2026-11-16" }), order(5, { deliveryDate: "2026-11-10" })],
      "2026-11-13",
    );
    expect(days.map((d) => d.date)).toEqual(["2026-11-15", "2026-11-16", "2026-11-10"]);
    expect(days[0].orders).toHaveLength(3);
    expect(days[0].summary).toEqual([{ productId: "schnitzel", name: "שניצל", saleUnit: "KG", quantity: 1.5 }]);
    expect(days[0].totalAgorot).toBe(150_00);
  });
});
