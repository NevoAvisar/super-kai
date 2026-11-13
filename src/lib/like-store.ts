/**
 * Storage for dish likes. One like per (product, visitor); counts are the
 * number of distinct visitors. Two implementations: PostgreSQL (likes.ts,
 * when CATALOG_SOURCE="db") and this in-memory one for mock/dev/CI, which
 * resets whenever the server restarts.
 */
export interface LikeSummary {
  /** productId → number of visitors who like it (only ids with ≥1 like). */
  counts: Record<string, number>;
  /** productIds this visitor likes. */
  mine: string[];
}

export interface LikeStore {
  summary(productIds: string[], visitorId: string | null): Promise<LikeSummary>;
  /** Idempotent: sets this visitor's like to `liked`, returns the new count. */
  set(productId: string, visitorId: string, liked: boolean): Promise<number>;
}

export function createMemoryLikeStore(): LikeStore {
  const likes = new Map<string, Set<string>>();
  return {
    async summary(productIds, visitorId) {
      const counts: Record<string, number> = {};
      const mine: string[] = [];
      for (const id of productIds) {
        const set = likes.get(id);
        if (!set?.size) continue;
        counts[id] = set.size;
        if (visitorId && set.has(visitorId)) mine.push(id);
      }
      return { counts, mine };
    },
    async set(productId, visitorId, liked) {
      let set = likes.get(productId);
      if (!set) likes.set(productId, (set = new Set()));
      if (liked) set.add(visitorId);
      else set.delete(visitorId);
      return set.size;
    },
  };
}
