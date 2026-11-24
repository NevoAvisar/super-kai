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
  opts: {
    categories?: string[];
    perCategory?: number;
    isSignature?: (p: T) => boolean;
    /**
     * Vary the line-up: draw `perCategory` dishes at random from the top `pool`
     * of each category, the more popular ones more likely. Without it the pick
     * is deterministic (the top `perCategory`).
     */
    random?: () => number;
    pool?: number;
  } = {},
): RankedDish<T>[] {
  const { categories = HERO_CATEGORIES, perCategory = 2, isSignature = () => false, random, pool = perCategory * 2 } = opts;
  const order = new Map(products.map((p, i) => [p.id, i]));
  return categories.flatMap((slug) => {
    const ranked = products
      .filter((p) => p.categorySlug === slug)
      .map((product) => ({ product, score: popularityScore(signals[product.id]) }))
      .sort(
        (a, b) =>
          b.score - a.score ||
          Number(b.product.isFeatured) - Number(a.product.isFeatured) ||
          Number(isSignature(b.product)) - Number(isSignature(a.product)) ||
          order.get(a.product.id)! - order.get(b.product.id)!,
      )
      .map((d, rank) => ({ ...d, rank }));
    return random ? weightedSample(ranked.slice(0, Math.max(pool, perCategory)), perCategory, random) : ranked.slice(0, perCategory);
  });
}

/** Draws `n` items without replacement, weighting by rank (top of the pool most likely); keeps rank order. */
function weightedSample<T extends { rank: number }>(items: T[], n: number, random: () => number): T[] {
  const left = [...items];
  const picked: T[] = [];
  while (picked.length < n && left.length) {
    const weights = left.map((d) => items.length - d.rank);
    let r = random() * weights.reduce((a, b) => a + b, 0);
    let i = 0;
    while (i < left.length - 1 && (r -= weights[i]) >= 0) i++;
    picked.push(...left.splice(i, 1));
  }
  return picked.sort((a, b) => a.rank - b.rank);
}
