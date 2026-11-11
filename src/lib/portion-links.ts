import type { CatalogCategory } from "./catalog";

/** Maps each portion-guide course to the category the customer should shop. */
export function portionLinks(categories: CatalogCategory[]) {
  const slug = (g: CatalogCategory["portionGroup"]) => categories.find((c) => c.portionGroup === g)?.slug;
  return { firsts: slug("FIRSTS"), mains: slug("MAINS"), sides: slug("SIDES") };
}
