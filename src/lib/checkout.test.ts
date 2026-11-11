import { describe, expect, it } from "vitest";
import { validateCheckout, type CheckoutInput, type PricedProduct } from "./checkout";

const catalog: PricedProduct[] = [
  { id: "brisket", name: "בריסקט", saleUnit: "KG", priceAgorot: 249_00, listPriceAgorot: 249_00, inStock: true },
  { id: "soup", name: "מרק", saleUnit: "UNIT", priceAgorot: 34_00, listPriceAgorot: 34_00, inStock: true },
  { id: "gone", name: "לברק", saleUnit: "KG", priceAgorot: 159_00, listPriceAgorot: 159_00, inStock: false },
];
// Wednesday 2026-11-11, 10:00 Israel (UTC+2) → delivery Thursday 12.11
const morning = new Date("2026-11-11T08:00:00Z");
const base: CheckoutInput = {
  items: [{ productId: "brisket", quantity: 0.5 }],
  fulfillment: "DELIVERY",
  deliveryDate: "2026-11-12",
  contact: { name: "ישראל ישראלי", phone: "050-1234567", email: "test@example.com" },
  address: { city: "תל אביב", street: "הרצל", houseNumber: "1" },
};

describe("validateCheckout", () => {
  it("prices the order on the server and charges delivery under 150 ₪", () => {
    const r = validateCheckout(base, catalog, morning);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.totals.subtotalAgorot).toBe(124_50);
    expect(r.order.totals.deliveryFeeAgorot).toBe(25_00);
    expect(r.order.totals.totalAgorot).toBe(149_50);
  });
  it("gives free delivery from 150 ₪", () => {
    const r = validateCheckout({ ...base, items: [{ productId: "brisket", quantity: 0.75 }] }, catalog, morning);
    expect(r.ok && r.order.totals.deliveryFeeAgorot).toBe(0);
  });
  it("rejects quantities off the 0.25 kg grid and fractional units", () => {
    expect(validateCheckout({ ...base, items: [{ productId: "brisket", quantity: 0.3 }] }, catalog, morning).ok).toBe(false);
    expect(validateCheckout({ ...base, items: [{ productId: "soup", quantity: 1.5 }] }, catalog, morning).ok).toBe(false);
  });
  it("rejects a delivery date that went stale after 14:30", () => {
    const afterCutoff = new Date("2026-11-11T12:45:00Z"); // 14:45 Israel
    const r = validateCheckout(base, catalog, afterCutoff);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.deliveryDate).toBeDefined();
    expect(r.deliveryDate).toBe("2026-11-13");
  });
  it("rejects out-of-stock items and missing address for delivery", () => {
    const r = validateCheckout({ ...base, items: [{ productId: "gone", quantity: 1 }], address: undefined }, catalog, morning);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.items).toBeDefined();
    expect(r.errors.city).toBeDefined();
  });
  it("does not need an address for pickup", () => {
    expect(validateCheckout({ ...base, fulfillment: "PICKUP", address: undefined }, catalog, morning).ok).toBe(true);
  });
});
