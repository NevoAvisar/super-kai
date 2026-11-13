import type { CatalogProduct } from "@/lib/catalog";

/**
 * Presentation data for the home-page Dish Orbit carousel.
 * The dishes themselves come from the catalog (featured signature products);
 * this file only adds what the catalog doesn't store: an accent colour that
 * drives the pastel arcs, and an optional cooking video.
 */
export interface DishOrbitExtras {
  /** Hex colour the arcs and background morph to while this dish is on stage. */
  accent: string;
  /** Optional MP4/WebM (e.g. /videos/<slug>.mp4). The "play video" button only shows when set. */
  videoUrl?: string;
}

export const DISH_ORBIT: Record<string, DishOrbitExtras> = {
  "shuba-jar": { accent: "#c2457a" }, // beetroot magenta
  "chicken-liver-pate": { accent: "#b07a4f" }, // cognac
  "slow-braised-brisket": { accent: "#9a4a2e" }, // red-wine braise
  "pistachio-crusted-salmon": { accent: "#e07a5f" }, // salmon coral
  "creamy-artichoke-soup": { accent: "#8fa05a" }, // artichoke green
  "beef-pine-nut-strudel": { accent: "#c9964a" }, // golden pastry
  "sweet-potato-goat-cheese-quiche": { accent: "#e39b4f" }, // sweet potato
  "honey-cumin-glazed-carrots": { accent: "#e2732e" }, // glazed carrot
};

/** Fallback accent for dishes not listed above. */
export const CATEGORY_ACCENT: Record<string, string> = {
  "first-courses": "#8fa05a",
  "main-courses": "#b4532a",
  sides: "#e2732e",
  soups: "#c9964a",
  bakes: "#d18b47",
  spreads: "#6b7740",
  meals: "#9a4422",
};

export const CHEF = { name: "קאי", initial: "ק", role: "השף והבעלים", note: "מבשל כל בוקר מחדש" };

/** One slide of the carousel: a catalog product plus its signature-menu extras. */
export interface OrbitDish {
  product: CatalogProduct;
  categoryName: string;
  nameEn: string | null;
  ingredients: string[];
  servingGuide: string | null;
  accent: string;
  videoUrl: string | null;
}
