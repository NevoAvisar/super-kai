"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getDishLikes, setDishLike } from "@/app/actions/likes";

export interface DishLike {
  /** null until the counts have loaded. */
  count: number | null;
  liked: boolean;
  toggle: () => void;
}

/**
 * Shared like counts for the carousel's dishes: one request on mount, then
 * optimistic toggles reconciled with the server's count.
 */
export function useDishLikes(productIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const seq = useRef<Record<string, number>>({}); // ignore out-of-order responses per dish
  const key = productIds.join(",");

  useEffect(() => {
    let alive = true;
    getDishLikes(key.split(","))
      .then((s) => {
        if (!alive) return;
        setCounts(s.counts);
        setMine(new Set(s.mine));
      })
      .catch(() => alive && setCounts({}));
    return () => void (alive = false);
  }, [key]);

  const toggle = useCallback(
    (id: string) => {
      const liked = !mine.has(id);
      const prevCount = counts?.[id] ?? 0;
      const apply = (isLiked: boolean, count: number) => {
        setMine((m) => {
          const next = new Set(m);
          if (isLiked) next.add(id);
          else next.delete(id);
          return next;
        });
        setCounts((c) => ({ ...c, [id]: count }));
      };
      apply(liked, Math.max(0, prevCount + (liked ? 1 : -1)));
      const n = (seq.current[id] = (seq.current[id] ?? 0) + 1);
      setDishLike(id, liked)
        .then((r) => seq.current[id] === n && apply(r.liked, r.count))
        .catch(() => seq.current[id] === n && apply(!liked, prevCount));
    },
    [counts, mine],
  );

  return useCallback(
    (id: string): DishLike => ({ count: counts ? (counts[id] ?? 0) : null, liked: mine.has(id), toggle: () => toggle(id) }),
    [counts, mine, toggle],
  );
}
