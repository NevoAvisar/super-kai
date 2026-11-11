import { describe, expect, it } from "vitest";
import { calculatePortions, estimateServings, roundUpToStepKg } from "./portion-guide";
import { pricePer100g } from "./pricing";

const base = { guests: 10, appetite: "regular" as const, salads: 0, mains: 0, mainsKind: "boneless" as const, sides: 0 };

describe("roundUpToStepKg", () => {
  it("rounds up to the next quarter kilo", () => {
    expect(roundUpToStepKg(1500)).toBe(1.5);
    expect(roundUpToStepKg(1501)).toBe(1.75);
    expect(roundUpToStepKg(100)).toBe(0.25);
    expect(roundUpToStepKg(0)).toBe(0);
  });
});

describe("calculatePortions", () => {
  it("mains: 150 g boneless / 300 g bone-in per guest", () => {
    expect(calculatePortions({ ...base, mains: 1 }).mains!.totalKg).toBe(1.5);
    expect(calculatePortions({ ...base, mains: 1, mainsKind: "boneIn" }).mains!.totalKg).toBe(3);
  });
  it("splits mains across dishes", () => {
    const r = calculatePortions({ ...base, mains: 2 });
    expect(r.mains!.perDishKg).toBe(0.75);
  });
  it("firsts: ~50 g per salad, kept within 150–200 g", () => {
    expect(calculatePortions({ ...base, salads: 1 }).firsts!.gramsPerGuest).toBe(150);
    expect(calculatePortions({ ...base, salads: 3 }).firsts!.perDishKg).toBe(0.5); // 10 × 50 g
    expect(calculatePortions({ ...base, salads: 4 }).firsts!.gramsPerGuest).toBe(200);
    expect(calculatePortions({ ...base, salads: 8 }).firsts!.gramsPerGuest).toBe(200);
    expect(calculatePortions({ ...base, salads: 4, appetite: "light" }).firsts!.gramsPerGuest).toBe(150);
  });
  it("sides: 100–150 g by appetite", () => {
    expect(calculatePortions({ ...base, sides: 1, appetite: "light" }).sides!.gramsPerGuest).toBe(100);
    expect(calculatePortions({ ...base, sides: 1, appetite: "hearty" }).sides!.gramsPerGuest).toBe(150);
  });
  it("a full regular meal stays within ~600 g edible per guest", () => {
    const r = calculatePortions({ ...base, salads: 4, mains: 2, sides: 2, appetite: "hearty" });
    expect(r.ediblePerGuest).toBeLessThanOrEqual(600);
  });
  it("bone weight doesn't count toward the 600 g rule", () => {
    const r = calculatePortions({ ...base, salads: 4, mains: 1, mainsKind: "boneIn", sides: 1, appetite: "hearty" });
    expect(r.ediblePerGuest).toBe(500); // 200 + 150 edible + 150
    expect(r.scaledToCap).toBe(false);
  });
});

describe("estimateServings", () => {
  it("estimates guests served per quantity", () => {
    expect(estimateServings(0.75, "MAINS")).toBe(5);
    expect(estimateServings(0.75, "MAINS", true)).toBe(2);
    expect(estimateServings(1, "OTHER")).toBeNull();
  });
});

describe("pricePer100g", () => {
  it("derives from per-kg or per-unit prices", () => {
    expect(pricePer100g(89_00, "KG")).toBe(8_90);
    expect(pricePer100g(34_00, "UNIT", 400)).toBe(8_50);
    expect(pricePer100g(45_00, "UNIT")).toBeNull();
  });
});
