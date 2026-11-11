import fs from "node:fs";
import path from "node:path";
import photoData from "@/data/product-photos.json";

const DIR = path.join(process.cwd(), "public", "products");
const EXTENSIONS = [".jpg", ".webp", ".jpeg", ".png", ".avif"];

export interface ProductPhoto {
  src: string;
  credit: { name: string; url: string } | null;
  pageUrl: string | null;
}

type PhotoEntry = { src: string; credit?: { name: string; url: string }; pageUrl?: string };
const photos = (photoData as { photos: Record<string, PhotoEntry> }).photos;

/**
 * Photo for a dish, in priority order:
 *  1. a local file at public/products/<slug>.<ext> (AI-generated or your own
 *     shoot); `?v=<mtime>` busts caches when it's replaced
 *  2. the Unsplash photo assigned in src/data/product-photos.json
 */
export function findProductImage(slug: string): ProductPhoto | null {
  for (const ext of EXTENSIONS) {
    try {
      const { mtimeMs } = fs.statSync(path.join(DIR, slug + ext));
      return { src: `/products/${slug}${ext}?v=${Math.round(mtimeMs).toString(36)}`, credit: null, pageUrl: null };
    } catch {
      // not found, try next extension
    }
  }
  const p = photos[slug];
  return p ? { src: p.src, credit: p.credit ?? null, pageUrl: p.pageUrl ?? null } : null;
}
