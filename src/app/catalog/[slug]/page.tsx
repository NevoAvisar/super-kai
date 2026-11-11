import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/catalog";
import { CategoryNav } from "@/components/CategoryNav";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { PortionGuide } from "@/components/PortionGuide";
import { portionLinks } from "@/lib/portion-links";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  return { title: category?.name ?? "קטגוריה" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [categories, category, products] = await Promise.all([
    getCategories(),
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
  ]);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-brand-600">המעדנייה של קאי</p>
          <h1 className="font-display text-4xl font-bold md:text-5xl">{category.name}</h1>
          {category.description && <p className="mt-1 text-muted">{category.description}</p>}
        </div>
        <PortionGuide links={portionLinks(categories)} />
      </div>
      <CategoryNav categories={categories} active={slug} />
      <CatalogBrowser categories={[category]} products={products} />
    </div>
  );
}

// Re-read the catalog (prices, stock, promotions) at most once a minute.
export const revalidate = 60;
