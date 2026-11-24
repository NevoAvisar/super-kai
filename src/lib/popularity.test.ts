import { describe, expect, it } from "vitest";
import { pickHeroDishes, popularityScore } from "./popularity";

const p = (id: string, categorySlug: string, isFeatured = false) => ({ id, categorySlug, isFeatured });

describe("popularityScore", () => {
  it("weights orders above likes", () => {
    expect(popularityScore({ orders: 2, likes: 1 })).toBe(7);
    expect(popularityScore(undefined)).toBe(0);
  });
});

describe("pickHeroDishes", () => {
  const products = [
    p("soup-a", "soups"),
    p("main-a", "main-courses", true),
    p("main-b", "main-courses"),
    p("main-c", "main-courses"),
    p("soup-b", "soups", true),
    p("cake", "desserts", true),
  ];

  it("groups by category in the given order and takes N per category", () => {
    const ids = pickHeroDishes(products, {}, { categories: ["main-courses", "soups"], perCategory: 2 }).map(
      (d) => d.product.id,
    );
    expect(ids).toEqual(["main-a", "main-b", "soup-b", "soup-a"]); // featured first, then catalog order
  });

  it("lets customer demand outrank the featured flag", () => {
    const ranked = pickHeroDishes(products, { "main-c": { orders: 1, likes: 0 } }, { categories: ["main-courses"] });
    expect(ranked.map((d) => [d.product.id, d.rank, d.score])).toEqual([
      ["main-c", 0, 3],
      ["main-a", 1, 0],
    ]);
  });

  it("uses signature dishes as a tie-breaker", () => {
    const ids = pickHeroDishes(products, {}, {
      categories: ["main-courses"],
      perCategory: 1,
      isSignature: (x) => x.id === "main-c",
    }).map((d) => d.product.id);
    expect(ids).toEqual(["main-a"]); // featured still beats signature
    const ids2 = pickHeroDishes([p("x", "sides"), p("y", "sides")], {}, {
      categories: ["sides"],
      perCategory: 1,
      isSignature: (x) => x.id === "y",
    }).map((d) => d.product.id);
    expect(ids2).toEqual(["y"]);
  });

  describe("with random (varied line-up)", () => {
    const mains = ["m0", "m1", "m2", "m3", "m4", "m5"].map((id) => p(id, "main-courses"));
    const opts = { categories: ["main-courses"], perCategory: 2, pool: 4 };

    it("draws from the top of the pool only, keeping rank order and original ranks", () => {
      for (const r of [0, 0.3, 0.6, 0.99]) {
        const picked = pickHeroDishes(mains, {}, { ...opts, random: () => r });
        expect(picked).toHaveLength(2);
        expect(picked.every((d) => d.rank < 4)).toBe(true);
        expect(picked[0].rank).toBeLessThan(picked[1].rank);
        expect(new Set(picked.map((d) => d.product.id)).size).toBe(2);
      }
    });

    it("varies between draws, favouring the most popular dishes", () => {
      let seed = 42;
      const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const counts: Record<string, number> = {};
      for (let i = 0; i < 2000; i++)
        for (const d of pickHeroDishes(mains, {}, { ...opts, random })) counts[d.product.id] = (counts[d.product.id] ?? 0) + 1;
      expect(Object.keys(counts).sort()).toEqual(["m0", "m1", "m2", "m3"]);
      expect(counts.m0).toBeGreaterThan(counts.m3);
    });

    it("returns the whole category when it is smaller than perCategory", () => {
      expect(pickHeroDishes([p("a", "sides")], {}, { categories: ["sides"], random: Math.random })).toHaveLength(1);
    });
  });
});
