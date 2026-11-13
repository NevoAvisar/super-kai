import "server-only";
import { seedCategories, seedProducts, withSlugs, type DietaryTag, type PortionGroup } from "@/data/catalog-seed";
import { pricePer100g } from "./pricing";
import { findProductImage } from "./product-images";
import { shekelsToAgorot } from "./money";
import type { SaleUnit } from "./quantity";

/**
 * Catalog read-model used by the public (no-login) pages.
 * Plain serialisable objects so they can be passed to client components.
 */
export interface CatalogCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  portionGroup: PortionGroup;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  /** Photographer credit for Unsplash photos. */
  imageCredit: { name: string; url: string } | null;
  categorySlug: string;
  categoryIcon: string | null;
  portionGroup: PortionGroup;
  saleUnit: SaleUnit;
  /** Net weight of one UNIT (soup container, jar…), null for KG products. */
  unitWeightGrams: number | null;
  unitLabel: string | null;
  hasBones: boolean;
  listPriceAgorot: number;
  priceAgorot: number; // effective price after live promotions
  /** Comparison price per 100 g (after promotion), null if not derivable. */
  pricePer100gAgorot: number | null;
  promoLabel: string | null;
  inStock: boolean;
  /** Still orderable, but nearly gone (admin stock status LOW_STOCK). */
  lowStock?: boolean;
  isFeatured: boolean;
  dietary: DietaryTag[];
}

const useDb = process.env.CATALOG_SOURCE === "db";

/** An explicit imageUrl (admin upload) wins; otherwise local file → Unsplash. */
function resolveImage(slug: string, explicit?: string | null) {
  if (explicit) return { imageUrl: explicit, imageCredit: null };
  const photo = findProductImage(slug);
  return { imageUrl: photo?.src ?? null, imageCredit: photo?.credit ?? null };
}

// ---------------------------------------------------------------------------
// Mock source (no database needed)
// ---------------------------------------------------------------------------
function mockCategories(): CatalogCategory[] {
  return seedCategories.map((c) => ({ id: c.slug, ...c }));
}

function mockProducts(): CatalogProduct[] {
  const cats = new Map(seedCategories.map((c) => [c.slug, c]));
  return withSlugs(seedProducts).map((p) => {
    const cat = cats.get(p.categorySlug)!;
    const saleUnit = p.saleUnit ?? "KG";
    const list = shekelsToAgorot(p.price);
    const price = p.promoPercent ? Math.round(list * (1 - p.promoPercent / 100)) : list;
    return {
      id: p.slug,
      slug: p.slug,
      name: p.name,
      description: p.description ?? null,
      ...resolveImage(p.slug, p.imageUrl),
      categorySlug: p.categorySlug,
      categoryIcon: cat.icon,
      portionGroup: cat.portionGroup,
      saleUnit,
      unitWeightGrams: p.unitWeightGrams ?? null,
      unitLabel: p.unitLabel ?? null,
      hasBones: !!p.hasBones,
      listPriceAgorot: list,
      priceAgorot: price,
      pricePer100gAgorot: pricePer100g(price, saleUnit, p.unitWeightGrams),
      promoLabel: p.promoPercent ? `${p.promoPercent}% הנחה` : null,
      inStock: !p.outOfStock,
      isFeatured: !!p.featured,
      dietary: p.dietary ?? [],
    };
  });
}

// ---------------------------------------------------------------------------
// Database source
// ---------------------------------------------------------------------------
async function dbCategories(): Promise<CatalogCategory[]> {
  const { prisma } = await import("./db");
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, description: true, icon: true, portionGroup: true },
  });
}

async function dbProducts(): Promise<CatalogProduct[]> {
  const { prisma } = await import("./db");
  const { getEffectivePrice, isPromotionLive } = await import("./pricing");
  const now = new Date();
  const rows = await prisma.product.findMany({
    where: { isActive: true, category: { isActive: true } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: {
      category: { include: { promotions: true } },
      promotions: true,
    },
  });
  return rows.map((p) => {
    const promos = [...p.promotions, ...p.category.promotions].filter((x) => isPromotionLive(x, now));
    const price = getEffectivePrice(p.priceAgorot, promos, now);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      ...resolveImage(p.slug, p.imageUrl),
      categorySlug: p.category.slug,
      categoryIcon: p.category.icon,
      portionGroup: p.category.portionGroup,
      saleUnit: p.saleUnit,
      unitWeightGrams: p.unitWeightGrams,
      unitLabel: p.unitLabel,
      hasBones: p.hasBones,
      listPriceAgorot: p.priceAgorot,
      priceAgorot: price,
      pricePer100gAgorot: pricePer100g(price, p.saleUnit, p.unitWeightGrams),
      promoLabel: price < p.priceAgorot ? (promos[0]?.title ?? "מבצע") : null,
      inStock: p.stockStatus !== "OUT_OF_STOCK",
      lowStock: p.stockStatus === "LOW_STOCK",
      isFeatured: p.isFeatured,
      dietary: p.dietary,
    };
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function getCategories(): Promise<CatalogCategory[]> {
  return useDb ? dbCategories() : mockCategories();
}

export async function getProducts(): Promise<CatalogProduct[]> {
  return useDb ? dbProducts() : mockProducts();
}

export async function getCategoryBySlug(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getProductsByCategory(slug: string) {
  return (await getProducts()).filter((p) => p.categorySlug === slug);
}

export async function getFeaturedProducts(limit = 8) {
  return (await getProducts()).filter((p) => p.isFeatured && p.inStock).slice(0, limit);
}
