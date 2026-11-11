import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/catalog";
import { CategoryNav } from "@/components/CategoryNav";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { PortionGuide } from "@/components/PortionGuide";
import { portionLinks } from "@/lib/portion-links";

export const metadata: Metadata = { title: "התפריט המלא" };

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-600">המעדנייה של קאי</p>
          <h1 className="font-display text-4xl font-bold md:text-5xl">התפריט המלא</h1>
          <p className="mt-1 text-muted">מבושל כל בוקר. נמכר לפי משקל, ברבעי קילו – או במנות מוכנות.</p>
        </div>
        <PortionGuide links={portionLinks(categories)} />
      </div>
      <CategoryNav categories={categories} />
      <CatalogBrowser categories={categories} products={products} />
    </div>
  );
}

// Re-read the catalog (prices, stock, promotions) at most once a minute.
export const revalidate = 60;
