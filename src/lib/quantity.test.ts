import { describe, expect, it } from "vitest";
import { decrementQuantity, incrementQuantity, isValidQuantity } from "./quantity";

describe("0.25 kg steps", () => {
  it("increments by quarter kilos without float drift", () => {
    let q = 0;
    const seen: number[] = [];
    for (let i = 0; i < 6; i++) seen.push((q = incrementQuantity(q, "KG")));
    expect(seen).toEqual([0.25, 0.5, 0.75, 1, 1.25, 1.5]);
  });
  it("decrements to 0 (= remove)", () => {
    expect(decrementQuantity(0.5, "KG")).toBe(0.25);
    expect(decrementQuantity(0.25, "KG")).toBe(0);
    expect(decrementQuantity(0, "KG")).toBe(0);
  });
  it("respects a max quantity", () => {
    expect(incrementQuantity(2, "KG", 2)).toBe(2);
  });
  it("validates quantities", () => {
    expect(isValidQuantity(0.75, "KG")).toBe(true);
    expect(isValidQuantity(0.3, "KG")).toBe(false);
    expect(isValidQuantity(-0.25, "KG")).toBe(false);
    expect(isValidQuantity(1.5, "UNIT")).toBe(false);
  });
});

describe("QA: per-line cap", () => {
  it("stops the KG stepper at 30 kg and the UNIT stepper at 50", () => {
    expect(incrementQuantity(30, "KG")).toBe(30);
    expect(incrementQuantity(29.75, "KG")).toBe(30);
    expect(incrementQuantity(50, "UNIT")).toBe(50);
  });
  it("walks 0.25 → 1.00 in exact quarter-kilo steps and back to 0 (removal)", () => {
    let q = 0;
    const up: number[] = [];
    for (let i = 0; i < 4; i++) up.push((q = incrementQuantity(q, "KG")));
    expect(up).toEqual([0.25, 0.5, 0.75, 1]);
    const down: number[] = [];
    for (let i = 0; i < 4; i++) down.push((q = decrementQuantity(q, "KG")));
    expect(down).toEqual([0.75, 0.5, 0.25, 0]);
  });
});
