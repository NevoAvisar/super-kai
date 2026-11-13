import type { CatalogProduct } from "@/lib/catalog";
import { DEFAULT_RULES } from "@/lib/config";

/**
 * Presentation data for the home-page Dish Orbit carousel.
 * The dishes come from the catalog, ranked by popularity (lib/hero-dishes.ts);
 * this file adds what the catalog doesn't store: accent colours for the
 * pastel arcs, optional cooking videos, and the welcome slide's copy.
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
  /** Part of Kai's signature menu (has an ingredient list). */
  signature: boolean;
  /** Most ordered / liked in its category right now (only when there is real data). */
  trending: boolean;
}

/** Slide 1 of the hero: who Kai is and how the kitchen works. Placeholder copy — replace with Kai's own words. */
export const WELCOME = {
  accent: "#b4532a",
  eyebrow: "מעדנייה ביתית · אוכל מוכן",
  title: "אוכל של בית, ברמה של מעדנייה.",
  story:
    "קאי מבשל אוכל ביתי כבר שנים – קודם למשפחה ולחברים, ואז לכל השכונה. סופר-קאי נולד מתוך רצון פשוט: שכל אחד יוכל להגיש לשולחן אוכל של בית, טרי ואמיתי, בלי לעמוד שעות במטבח.",
  pillars: [
    { icon: "🌅", title: "מבושל כל בוקר", text: "חומרי גלם טריים, בלי חומרים משמרים" },
    { icon: "⚖️", title: "לפי משקל", text: "כל לחיצה רבע קילו – בדיוק כמה שצריך" },
    { icon: "🚚", title: "מגיע מחר", text: `הזמנה עד ${DEFAULT_RULES.cutoffHour}:${String(DEFAULT_RULES.cutoffMinute).padStart(2, "0")} מגיעה כבר מחר` },
  ],
};
