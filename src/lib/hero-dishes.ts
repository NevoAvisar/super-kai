import "server-only";
import { seedProducts } from "@/data/catalog-seed";
import { CATEGORY_ACCENT, DISH_ORBIT, type OrbitDish } from "@/data/dish-orbit";
import { getCategories, getProducts } from "./catalog";
import { likeStore } from "./likes";
import { pickHeroDishes, TREND_WINDOW_DAYS, type PopularitySignal } from "./popularity";

/** Orders (last 30 days, paid, not cancelled) + likes per product. Never throws. */
async function popularitySignals(productIds: string[]): Promise<Record<string, PopularitySignal>> {
  const signals: Record<string, PopularitySignal> = {};
  const get = (id: string) => (signals[id] ??= { orders: 0, likes: 0 });

  try {
    const { counts } = await likeStore.summary(productIds, null);
    for (const [id, n] of Object.entries(counts)) get(id).likes = n;
  } catch (e) {
    console.error("[hero] like counts unavailable", e);
  }

  if (process.env.CATALOG_SOURCE === "db") {
    try {
      const { prisma } = await import("./db");
      const since = new Date(Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      const rows = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: {
          productId: { in: productIds },
          order: { createdAt: { gte: since }, status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } },
        },
        _count: true,
      });
      for (const r of rows) if (r.productId) get(r.productId).orders = r._count;
    } catch (e) {
      console.error("[hero] order trends unavailable", e);
    }
  }
  return signals;
}

/**
 * The hero carousel's dishes: popular in-stock dishes of each hero category
 * (mains → salads → soups → sides), ranked by what customers order and like.
 * With `varied`, each call draws a fresh selection from the top of each
 * category (popular dishes more likely), so the home page changes per visit.
 */
export async function getHeroDishes(perCategory = 2, { varied = false } = {}): Promise<OrbitDish[]> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const seed = new Map(seedProducts.filter((p) => p.slug).map((p) => [p.slug!, p]));
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));
  const candidates = products.filter((p) => p.inStock && p.imageUrl);
  const signals = await popularitySignals(candidates.map((p) => p.id));

  return pickHeroDishes(candidates, signals, {
    perCategory,
    isSignature: (p) => !!seed.get(p.slug)?.ingredients?.length,
    ...(varied && { random: Math.random, pool: perCategory * 3 }),
  }).map(({ product, score, rank }) => {
    const s = seed.get(product.slug);
    const extras = DISH_ORBIT[product.slug];
    return {
      product,
      categoryName: categoryName.get(product.categorySlug) ?? "",
      nameEn: s?.nameEn ?? null,
      ingredients: s?.ingredients ?? [],
      servingGuide: s?.servingGuide ?? null,
      accent: extras?.accent ?? CATEGORY_ACCENT[product.categorySlug] ?? "#b4532a",
      videoUrl: extras?.videoUrl ?? null,
      signature: !!s?.ingredients?.length,
      trending: rank === 0 && score > 0,
    };
  });
}
