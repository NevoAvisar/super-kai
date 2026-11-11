import { describe, expect, it } from "vitest";
import { applyPromotion, calculateCartTotals, calculateDeliveryFee, getEffectivePrice, lineTotal } from "./pricing";

describe("calculateDeliveryFee", () => {
  it("charges the fee for delivery below 150 ₪", () => {
    expect(calculateDeliveryFee(149_99, "DELIVERY")).toBe(25_00);
  });
  it("is free for delivery at exactly 150 ₪ and above", () => {
    expect(calculateDeliveryFee(150_00, "DELIVERY")).toBe(0);
    expect(calculateDeliveryFee(420_00, "DELIVERY")).toBe(0);
  });
  it("is always free for self-pickup", () => {
    expect(calculateDeliveryFee(30_00, "PICKUP")).toBe(0);
  });
  it("is 0 for an empty cart", () => {
    expect(calculateDeliveryFee(0, "DELIVERY")).toBe(0);
  });
});

describe("lineTotal", () => {
  it("multiplies price per kg by quarter-kilo quantities", () => {
    expect(lineTotal(89_00, 0.25, "KG")).toBe(22_25);
    expect(lineTotal(89_00, 0.75, "KG")).toBe(66_75);
    expect(lineTotal(39_90, 0.25, "KG")).toBe(9_98); // 997.5 → rounded
  });
  it("handles unit products", () => {
    expect(lineTotal(45_00, 2, "UNIT")).toBe(90_00);
  });
});

describe("calculateCartTotals", () => {
  it("adds the fee and reports the gap to free delivery", () => {
    const t = calculateCartTotals([{ unitPriceAgorot: 100_00, quantity: 1, saleUnit: "KG" }], "DELIVERY");
    expect(t.subtotalAgorot).toBe(100_00);
    expect(t.deliveryFeeAgorot).toBe(25_00);
    expect(t.totalAgorot).toBe(125_00);
    expect(t.amountToFreeDeliveryAgorot).toBe(50_00);
    expect(t.qualifiesForFreeDelivery).toBe(false);
  });
  it("reports savings from promotions", () => {
    const t = calculateCartTotals(
      [{ unitPriceAgorot: 80_00, listPriceAgorot: 100_00, quantity: 2, saleUnit: "KG" }],
      "PICKUP",
    );
    expect(t.savingsAgorot).toBe(40_00);
    expect(t.deliveryFeeAgorot).toBe(0);
  });
});

describe("promotions", () => {
  const base = { startsAt: new Date("2026-01-01"), endsAt: null, isActive: true };
  it("applies percent, amount and fixed-price promotions", () => {
    expect(applyPromotion(100_00, { ...base, type: "PERCENT_OFF", value: 15 })).toBe(85_00);
    expect(applyPromotion(100_00, { ...base, type: "AMOUNT_OFF", value: 10_00 })).toBe(90_00);
    expect(applyPromotion(100_00, { ...base, type: "FIXED_PRICE", value: 79_00 })).toBe(79_00);
  });
  it("picks the best live promotion and ignores expired ones", () => {
    const now = new Date("2026-11-11T10:00:00Z");
    const price = getEffectivePrice(
      100_00,
      [
        { ...base, type: "PERCENT_OFF", value: 10 },
        { ...base, type: "PERCENT_OFF", value: 50, endsAt: new Date("2026-11-01") },
        { ...base, type: "AMOUNT_OFF", value: 20_00, isActive: false },
      ],
      now,
    );
    expect(price).toBe(90_00);
  });
});
