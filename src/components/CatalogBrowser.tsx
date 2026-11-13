"use client";

import { useMemo, useState } from "react";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import { DIETARY, DIETARY_ORDER, type DietaryTag } from "@/lib/dietary";
import { useLiveCatalog } from "@/lib/use-live-catalog";
import { ProductGrid } from "./ProductGrid";

interface Props {
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

/** Free browsing: search, dietary filters and products grouped by category. No login required. */
export function CatalogBrowser({ categories, products: baseProducts }: Props) {
  // Admin edits kept in this browser (prices, stock, new products, promotions) layer over the server catalog.
  const live = useLiveCatalog(baseProducts);
  const products = useMemo(() => {
    const shown = new Set(categories.map((c) => c.slug));
    return live.filter((p) => shown.has(p.categorySlug));
  }, [live, categories]);
  const [query, setQuery] = useState("");
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [diet, setDiet] = useState<DietaryTag[]>([]);

  const toggle = (t: DietaryTag) => setDiet((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));

  const filtered = useMemo(() => {
    const q = query.trim();
    return products.filter(
      (p) =>
        (!q || p.name.includes(q) || (p.description ?? "").includes(q)) &&
        (!onlyDeals || p.promoLabel) &&
        diet.every((t) => p.dietary.includes(t)),
    );
  }, [products, query, onlyDeals, diet]);

  const groups = categories
    .map((c) => ({ category: c, items: filtered.filter((p) => p.categorySlug === c.slug) }))
    .filter((g) => g.items.length > 0);

  const chip = (on: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm transition ring-1 ${
      on ? "bg-ink text-paper ring-ink" : "bg-paper ring-line hover:ring-brand-500"
    }`;

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש במעדנייה… (סלמון, קיש, טחינה)"
            className="w-full rounded-full bg-paper px-5 py-3 text-sm ring-1 ring-line outline-none focus:ring-brand-500 sm:max-w-md"
          />
          <span className="text-sm text-muted sm:ms-auto">{filtered.length} מנות</span>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="סינון">
          <button type="button" className={chip(onlyDeals)} onClick={() => setOnlyDeals((v) => !v)} aria-pressed={onlyDeals}>
            מבצעים
          </button>
          {DIETARY_ORDER.map((t) => (
            <button key={t} type="button" className={chip(diet.includes(t))} onClick={() => toggle(t)} aria-pressed={diet.includes(t)}>
              {DIETARY[t].label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && <p className="py-16 text-center text-muted">לא מצאנו מנות שמתאימות לסינון.</p>}

      {groups.map(({ category, items }, gi) => (
        <section key={category.slug} id={category.slug} className="scroll-mt-32">
          {categories.length > 1 && (
            <div className="mb-5 flex items-baseline gap-3 border-b border-line pb-3">
              <h2 className="font-display text-3xl font-bold">{category.name}</h2>
              {category.description && <p className="hidden text-sm text-muted sm:block">{category.description}</p>}
            </div>
          )}
          <ProductGrid products={items} priorityCount={gi === 0 ? 4 : 0} />
        </section>
      ))}
    </div>
  );
}
