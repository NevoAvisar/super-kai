/**
 * Picks the hero carousel's dishes: N per category, ranked by what customers
 * actually do (recent orders, likes), falling back to Kai's featured /
 * signature picks when there's no data yet. Pure, so it's unit-tested.
 */
export interface PopularitySignal {
  /** Paid orders containing the dish in the trend window. */
  orders: number;
  likes: number;
}

/** An order says more than a like. */
export const popularityScore = (s: PopularitySignal | undefined) => (s ? s.orders * 3 + s.likes : 0);

/** Category order of the carousel: mains → salads → soups → sides. */
export const HERO_CATEGORIES = ["main-courses", "first-courses", "soups", "sides"];
export const TREND_WINDOW_DAYS = 30;

interface Rankable {
  id: string;
  categorySlug: string;
  isFeatured: boolean;
}

export interface RankedDish<T> {
  product: T;
  score: number;
  /** 0 = most popular in its category. */
  rank: number;
}

export function pickHeroDishes<T extends Rankable>(
  products: T[],
  signals: Record<string, PopularitySignal>,
  opts: { categories?: string[]; perCategory?: number; isSignature?: (p: T) => boolean } = {},
): RankedDish<T>[] {
  const { categories = HERO_CATEGORIES, perCategory = 2, isSignature = () => false } = opts;
  const order = new Map(products.map((p, i) => [p.id, i]));
  return categories.flatMap((slug) =>
    products
      .filter((p) => p.categorySlug === slug)
      .map((product) => ({ product, score: popularityScore(signals[product.id]) }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.product.isFeatured) - Number(a.product.isFeatured) ||
          Number(isSignature(b.product)) - Number(isSignature(a.product)) ||
          order.get(a.product.id)! - order.get(b.product.id)!,
      )
      .slice(0, perCategory)
      .map((d, rank) => ({ ...d, rank })),
  );
}
