import { describe, expect, it } from "vitest";
import {
  customerRevenueShare,
  customerTier,
  favoriteDishes,
  groupByZone,
  kitchenPrep,
  needsPrep,
  periodKpis,
  productSales,
  statusBreakdown,
  trendPercent,
  trendSeries,
  zoneForCity,
} from "./admin-analytics";
import { generateDemoOrders } from "./demo-orders";
import type { LocalOrder } from "./local-admin";

const TODAY = "2026-11-13";
let n = 0;
const order = (over: Partial<LocalOrder> & { total?: number; city?: string } = {}): LocalOrder => {
  const { total = 100_00, city = "חולון", ...rest } = over;
  n += 1;
  return {
    id: `o${n}`,
    orderNumber: n,
    userEmail: null,
    status: "CONFIRMED",
    fulfillment: "DELIVERY",
    deliveryDate: TODAY,
    createdAt: "2026-11-12T09:00:00.000Z",
    contact: { name: "דנה", phone: "0501234567", email: "dana@example.com" },
    address: { city, street: "הרצל", houseNumber: "1" },
    lines: [{ productId: "brisket", name: "בריסקט", saleUnit: "KG", quantity: 0.5, unitPriceAgorot: 200_00, lineTotalAgorot: 100_00 }],
    totals: { subtotalAgorot: total, savingsAgorot: 0, deliveryFeeAgorot: 0, totalAgorot: total },
    ...rest,
  };
};

describe("zones", () => {
  it("maps cities to delivery zones, tolerating quotes and spacing", () => {
    expect(zoneForCity("חולון").id).toBe("south-dan");
    expect(zoneForCity(" ראשון  לציון ").id).toBe("south-dan");
    expect(zoneForCity("תל אביב-יפו").id).toBe("tel-aviv");
    expect(zoneForCity("מודיעין").id).toBe("modiin");
    expect(zoneForCity("חיפה").id).toBe("other");
    expect(zoneForCity(null).id).toBe("other");
  });

  it("groups orders by zone with delivery counts, pickup last", () => {
    const groups = groupByZone([
      order({ fulfillment: "PICKUP", address: null }),
      order({ city: "בת ים", status: "PENDING_PAYMENT" }),
      order({ city: "חולון" }),
      order({ city: "גבעתיים" }),
    ]);
    expect(groups.map((g) => g.zone.id)).toEqual(["south-dan", "tel-aviv", "pickup"]);
    expect(groups[0]).toMatchObject({ deliveries: 2, pending: 1, open: 1 });
    expect(groups[2].deliveries).toBe(0);
  });
});

describe("KPIs", () => {
  const orders = [
    order({ total: 100_00 }),
    order({ total: 50_00, fulfillment: "PICKUP", address: null }),
    order({ total: 999_00, status: "CANCELLED" }),
    order({ total: 80_00, deliveryDate: "2026-11-12", status: "COMPLETED" }),
    order({ total: 40_00, deliveryDate: "2026-11-05", status: "COMPLETED" }),
    order({ total: 70_00, deliveryDate: "2026-11-14", status: "PENDING_PAYMENT" }),
  ];

  it("totals the period ending today and the one before it, ignoring cancelled and future orders", () => {
    expect(periodKpis(orders, "day", TODAY)).toEqual({
      current: { revenueAgorot: 150_00, deliveries: 1, orders: 2 },
      previous: { revenueAgorot: 80_00, deliveries: 1, orders: 1 },
    });
    expect(periodKpis(orders, "week", TODAY).current).toEqual({ revenueAgorot: 230_00, deliveries: 2, orders: 3 });
    expect(periodKpis(orders, "week", TODAY).previous.revenueAgorot).toBe(40_00);
  });

  it("reports the trend in percent, or null with nothing to compare", () => {
    expect(trendPercent(150, 100)).toBe(50);
    expect(trendPercent(50, 100)).toBe(-50);
    expect(trendPercent(50, 0)).toBeNull();
  });

  it("builds 14 daily, 8 weekly and 6 monthly buckets that end today", () => {
    const daily = trendSeries(orders, "day", TODAY);
    expect(daily).toHaveLength(14);
    expect(daily[13]).toMatchObject({ key: TODAY, label: "13.11", revenueAgorot: 150_00, deliveries: 1 });
    const weekly = trendSeries(orders, "week", TODAY);
    expect(weekly).toHaveLength(8);
    expect(weekly[7]).toMatchObject({ key: "2026-11-07", revenueAgorot: 230_00 });
    const monthly = trendSeries(orders, "month", TODAY);
    expect(monthly.map((b) => b.label)).toEqual(["יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר"]);
    expect(monthly[5].revenueAgorot).toBe(340_00);
  });

  it("counts the three live status groups", () => {
    expect(statusBreakdown(orders)).toEqual({ pending: 1, open: 2, delivered: 2 });
  });
});

describe("customers", () => {
  const person = (i: number, total: number) => order({ total, contact: { name: `לקוח ${i}`, phone: "0", email: `c${i}@example.com` } });

  it("ranks customers by revenue and folds the tail into one slice", () => {
    const { slices, totalAgorot } = customerRevenueShare([person(1, 300_00), person(2, 100_00), person(1, 50_00), person(3, 20_00), person(4, 10_00)], 2);
    expect(slices.map((s) => [s.key, s.revenueAgorot])).toEqual([["c1@example.com", 350_00], ["c2@example.com", 100_00], ["others", 30_00]]);
    expect(totalAgorot).toBe(480_00);
  });

  it("classifies VIP, regular and new customers", () => {
    expect(customerTier({ orders: [order()], totalAgorot: 2200_00 })).toBe("vip");
    expect(customerTier({ orders: Array.from({ length: 8 }, () => order()), totalAgorot: 500_00 })).toBe("vip");
    expect(customerTier({ orders: [order(), order()], totalAgorot: 200_00 })).toBe("regular");
    expect(customerTier({ orders: [order(), order({ status: "CANCELLED" })], totalAgorot: 100_00 })).toBe("new");
    expect(customerTier({ orders: [], totalAgorot: 0 })).toBe("new");
  });

  it("finds the dishes a customer orders most", () => {
    const soup = { productId: "soup", name: "מרק", saleUnit: "UNIT" as const, quantity: 1, unitPriceAgorot: 30_00, lineTotalAgorot: 30_00 };
    expect(favoriteDishes([order(), order(), order({ lines: [soup] })]).map((f) => [f.name, f.orders])).toEqual([["בריסקט", 2], ["מרק", 1]]);
  });
});

describe("kitchen and product sales", () => {
  const line = (productId: string, quantity: number, saleUnit: "KG" | "UNIT" = "KG") => ({ productId, name: productId, saleUnit, quantity, unitPriceAgorot: 100_00, lineTotalAgorot: Math.round(100_00 * quantity) });
  const orders = [
    order({ lines: [line("brisket", 0.5), line("soup", 2, "UNIT")] }),
    order({ lines: [line("brisket", 0.25)], status: "IN_PREPARATION" }),
    order({ lines: [line("brisket", 0.5)] }),
    order({ lines: [line("brisket", 1)], status: "PENDING_PAYMENT" }),
    order({ lines: [line("soup", 1, "UNIT")], status: "CANCELLED" }),
  ];

  it("sums each dish over the approved orders only", () => {
    expect(kitchenPrep(orders.filter(needsPrep))).toEqual([
      { productId: "brisket", name: "brisket", saleUnit: "KG", quantity: 1.25, orders: 3 },
      { productId: "soup", name: "soup", saleUnit: "UNIT", quantity: 2, orders: 1 },
    ]);
  });

  it("reports quantity and revenue per product, without cancelled orders", () => {
    const sales = productSales(orders);
    expect(sales.get("brisket")).toEqual({ quantity: 2.25, revenueAgorot: 225_00, orders: 4 });
    expect(sales.get("soup")).toEqual({ quantity: 2, revenueAgorot: 200_00, orders: 1 });
  });
});

describe("generateDemoOrders", () => {
  const products = Array.from({ length: 30 }, (_, i) => ({
    id: `p${i}`, name: `מנה ${i}`, saleUnit: i % 4 === 0 ? ("UNIT" as const) : ("KG" as const), priceAgorot: 4000 + i * 300, listPriceAgorot: 4000 + i * 300,
  }));
  const now = new Date("2026-11-13T08:00:00Z");
  const demo = generateDemoOrders(products, now);

  it("is deterministic and flags every order as sample data", () => {
    expect(generateDemoOrders(products, now)).toEqual(demo);
    expect(demo.length).toBeGreaterThan(60);
    expect(demo.every((o) => o.isDemo && o.orderNumber < 1001)).toBe(true);
    expect(new Set(demo.map((o) => o.id)).size).toBe(demo.length);
  });

  it("covers every status group, several zones, repeat dishes, and valid quantities", () => {
    expect(statusBreakdown(demo).pending).toBeGreaterThan(0);
    expect(statusBreakdown(demo).open).toBeGreaterThan(0);
    expect(statusBreakdown(demo).delivered).toBeGreaterThan(30);
    expect(groupByZone(demo).length).toBeGreaterThanOrEqual(4);
    const today = demo.filter((o) => o.deliveryDate === TODAY);
    expect(today.length).toBe(9);
    expect(kitchenPrep(today.filter(needsPrep)).some((r) => r.orders > 1)).toBe(true);
    for (const o of demo) {
      for (const l of o.lines) expect(Number.isInteger(l.quantity / (l.saleUnit === "KG" ? 0.25 : 1))).toBe(true);
      expect(o.totals.totalAgorot).toBe(o.totals.subtotalAgorot + o.totals.deliveryFeeAgorot);
    }
    expect(demo.filter((o) => o.deliveryDate < TODAY).every((o) => new Date(`${o.deliveryDate}T12:00:00Z`).getUTCDay() !== 6)).toBe(true);
    // Today and tomorrow are filled even on a Saturday.
    const saturday = generateDemoOrders(products, new Date("2026-11-14T08:00:00Z"));
    expect(saturday.filter((o) => o.deliveryDate === "2026-11-14")).toHaveLength(9);
  });

  it("returns nothing without a catalog", () => {
    expect(generateDemoOrders([], now)).toEqual([]);
  });
});
