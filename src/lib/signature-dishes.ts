import "server-only";
import { seedProducts } from "@/data/catalog-seed";
import { CATEGORY_ACCENT, DISH_ORBIT, type OrbitDish } from "@/data/dish-orbit";
import { getCategories, getProducts } from "./catalog";

/**
 * Featured, in-stock signature dishes (the ones with an ingredient list) for
 * the home-page orbit carousel. Prices/stock come from the live catalog
 * (mock or DB); ingredients and English names come from the signature menu.
 */
export async function getSignatureDishes(limit = 8): Promise<OrbitDish[]> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const seed = new Map(seedProducts.filter((p) => p.slug).map((p) => [p.slug!, p]));
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  return products
    .filter((p) => p.isFeatured && p.inStock && p.imageUrl && seed.get(p.slug)?.ingredients?.length)
    .slice(0, limit)
    .map((product) => {
      const s = seed.get(product.slug)!;
      const extras = DISH_ORBIT[product.slug];
      return {
        product,
        categoryName: categoryName.get(product.categorySlug) ?? "",
        nameEn: s.nameEn ?? null,
        ingredients: s.ingredients ?? [],
        servingGuide: s.servingGuide ?? null,
        accent: extras?.accent ?? CATEGORY_ACCENT[product.categorySlug] ?? "#b4532a",
        videoUrl: extras?.videoUrl ?? null,
      };
    });
}
