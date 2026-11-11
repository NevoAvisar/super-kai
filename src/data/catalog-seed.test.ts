import { describe, expect, it } from "vitest";
import { seedCategories, seedProducts, withSlugs } from "./catalog-seed";
import photoData from "./product-photos.json";
import { PHOTO_QUERIES } from "./photo-queries";

const products = withSlugs(seedProducts);

describe("catalog seed", () => {
  it("has 70–80 products across all categories", () => {
    expect(products.length).toBeGreaterThanOrEqual(70);
    expect(products.length).toBeLessThanOrEqual(80);
    for (const c of seedCategories) expect(products.some((p) => p.categorySlug === c.slug)).toBe(true);
  });

  it("has unique slugs", () => {
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
  });

  describe("aiImagePrompt", () => {
    it.each(products.map((p) => [p.slug, p] as const))("%s has a complete photo prompt", (_slug, p) => {
      const prompt = p.aiImagePrompt ?? "";
      expect(prompt.length).toBeGreaterThan(300);
      expect(prompt).toMatch(/^Professional food photography of /);
      expect(prompt).toMatch(/DSLR/);
      expect(prompt).toMatch(/depth of field/);
      expect(prompt).toMatch(/No text, no lettering, no labels, no watermark/);
    });

    it("is unique per dish", () => {
      const prompts = products.map((p) => p.aiImagePrompt);
      expect(new Set(prompts).size).toBe(prompts.length);
    });
  });

  describe("photos", () => {
    const photos = (photoData as { photos: Record<string, { src: string }> }).photos;
    it.each(products.map((p) => [p.slug] as const))("%s has a real photo and a search query", (slug) => {
      expect(photos[slug]?.src).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(PHOTO_QUERIES[slug]).toBeTruthy();
    });
    it("has no photos for dishes that no longer exist", () => {
      const slugs = new Set(products.map((p) => p.slug));
      expect(Object.keys(photos).filter((s) => !slugs.has(s))).toEqual([]);
    });
  });
});
