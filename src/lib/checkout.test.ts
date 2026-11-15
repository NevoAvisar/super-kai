import { describe, expect, it } from "vitest";
import { buildDataset } from "./il-address/dataset";
import { validateCheckout, type CheckoutInput, type PricedProduct } from "./checkout";

const row = (cityCode: number, city: string, streetCode: number, street: string) => ({ סמל_ישוב: cityCode, שם_ישוב: city, סמל_רחוב: streetCode, שם_רחוב: street });
const addresses = buildDataset(
  [row(5000, "תל אביב - יפו", 9000, "תל אביב - יפו"), row(5000, "תל אביב - יפו", 2215, "הרצל"), row(6600, "חולון", 401, "סוקולוב"), row(176, "אפיקים", 9000, "אפיקים")],
  "2026-11-11T00:00:00.000Z",
);
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
  address: { cityCode: 5000, city: "תל אביב - יפו", streetCode: 2215, street: "הרצל", houseNumber: "1" },
};

describe("validateCheckout", () => {
  it("prices the order on the server and charges delivery under 150 ₪", () => {
    const r = validateCheckout(base, catalog, addresses, morning);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.totals.subtotalAgorot).toBe(124_50);
    expect(r.order.totals.deliveryFeeAgorot).toBe(25_00);
    expect(r.order.totals.totalAgorot).toBe(149_50);
  });
  it("gives free delivery from 150 ₪", () => {
    const r = validateCheckout({ ...base, items: [{ productId: "brisket", quantity: 0.75 }] }, catalog, addresses, morning);
    expect(r.ok && r.order.totals.deliveryFeeAgorot).toBe(0);
  });
  it("rejects quantities off the 0.25 kg grid and fractional units", () => {
    expect(validateCheckout({ ...base, items: [{ productId: "brisket", quantity: 0.3 }] }, catalog, addresses, morning).ok).toBe(false);
    expect(validateCheckout({ ...base, items: [{ productId: "soup", quantity: 1.5 }] }, catalog, addresses, morning).ok).toBe(false);
  });
  it("rejects a delivery date that went stale after 14:30", () => {
    const afterCutoff = new Date("2026-11-11T12:45:00Z"); // 14:45 Israel
    const r = validateCheckout(base, catalog, addresses, afterCutoff);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.deliveryDate).toBeDefined();
    expect(r.deliveryDate).toBe("2026-11-13");
  });
  it("rejects out-of-stock items and missing address for delivery", () => {
    const r = validateCheckout({ ...base, items: [{ productId: "gone", quantity: 1 }], address: undefined }, catalog, addresses, morning);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.items).toBeDefined();
    expect(r.errors.city).toBeDefined();
  });
  it("blocks a delivery to a made-up city or to a street of another city", () => {
    const fake = validateCheckout({ ...base, address: { city: "עיר הקסמים", street: "הרצל", houseNumber: "1" } }, catalog, addresses, morning);
    expect(!fake.ok && fake.errors.city).toBeTruthy();
    const wrong = validateCheckout({ ...base, address: { cityCode: 5000, city: "תל אביב - יפו", street: "סוקולוב", houseNumber: "1" } }, catalog, addresses, morning);
    expect(!wrong.ok && wrong.errors.street).toBeTruthy();
  });
  it("returns the verified address with official codes, apartment and notes", () => {
    const r = validateCheckout({ ...base, address: { city: "חולון", street: "סוקולוב", houseNumber: "7", floor: "2", apartment: " 5 ", notes: "לצלצל" } }, catalog, addresses, morning);
    expect(r.ok && r.order.address).toEqual({ cityCode: 6600, city: "חולון", streetCode: 401, street: "סוקולוב", houseNumber: "7", floor: "2", apartment: "5", notes: "לצלצל" });
    const kibbutz = validateCheckout({ ...base, address: { cityCode: 176, city: "אפיקים", houseNumber: "4" } }, catalog, addresses, morning);
    expect(kibbutz.ok && kibbutz.order.address).toMatchObject({ streetCode: 9000, street: "אפיקים" });
    expect(validateCheckout({ ...base, fulfillment: "PICKUP", address: undefined }, catalog, addresses, morning)).toMatchObject({ ok: true, order: { address: null } });
  });
  it("does not need an address for pickup", () => {
    expect(validateCheckout({ ...base, fulfillment: "PICKUP", address: undefined }, catalog, addresses, morning).ok).toBe(true);
  });
});
