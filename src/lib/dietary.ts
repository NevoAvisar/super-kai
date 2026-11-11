import type { DietaryTag } from "@/data/catalog-seed";

export type { DietaryTag };

export const DIETARY: Record<DietaryTag, { label: string; short: string; className: string }> = {
  VEGETARIAN: { label: "צמחוני", short: "V", className: "bg-leaf-50 text-leaf-700 ring-leaf-600/20" },
  VEGAN: { label: "טבעוני", short: "VG", className: "bg-emerald-50 text-emerald-800 ring-emerald-700/20" },
  GLUTEN_FREE: { label: "ללא גלוטן", short: "GF", className: "bg-amber-50 text-amber-800 ring-amber-700/20" },
  SPICY: { label: "חריף", short: "🌶", className: "bg-red-50 text-red-700 ring-red-700/20" },
  KIDS_FAVORITE: { label: "אהוב על ילדים", short: "★", className: "bg-sky-50 text-sky-800 ring-sky-700/20" },
};

export const DIETARY_ORDER: DietaryTag[] = ["VEGAN", "VEGETARIAN", "GLUTEN_FREE", "SPICY", "KIDS_FAVORITE"];
