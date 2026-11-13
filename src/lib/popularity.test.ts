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
});
