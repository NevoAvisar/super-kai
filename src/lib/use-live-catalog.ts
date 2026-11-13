"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { CatalogProduct } from "./catalog";
import { applyLocalAdmin, isEmptyAdminData, type LocalAdminData } from "./local-admin";
import { useHydrated } from "./use-hydrated";
import { useAdminStore } from "@/store/admin";

/** The admin's local edits (overrides, added products, promotions) as one stable object. */
export function useLocalAdminData(): LocalAdminData {
  return useAdminStore(useShallow((s) => ({ overrides: s.overrides, added: s.added, promotions: s.promotions })));
}

/** A clock that ticks once a minute, so promotions start and end without a reload. */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * The server-rendered catalog with the admin's local edits applied on top.
 * Returns the base list during SSR and the first client render (no hydration
 * mismatch), then the merged one. See lib/local-admin.ts.
 */
export function useLiveCatalog(base: CatalogProduct[]): CatalogProduct[] {
  const hydrated = useHydrated();
  const data = useLocalAdminData();
  const now = useMinuteClock();
  return useMemo(
    () => (!hydrated || isEmptyAdminData(data) ? base : applyLocalAdmin(base, data, now)),
    [hydrated, base, data, now],
  );
}
