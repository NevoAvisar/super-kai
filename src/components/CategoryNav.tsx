import Link from "next/link";
import type { CatalogCategory } from "@/lib/catalog";

export function CategoryNav({ categories, active }: { categories: CatalogCategory[]; active?: string }) {
  const cls = (on: boolean) =>
    `whitespace-nowrap border-b-2 px-1 pb-2 text-[15px] transition ${
      on ? "border-brand-500 font-bold text-ink" : "border-transparent text-muted hover:text-ink"
    }`;
  return (
    <nav className="-mx-4 flex gap-6 overflow-x-auto border-b border-line px-4" aria-label="קטגוריות">
      <Link href="/catalog" className={cls(!active)}>
        כל המעדנייה
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} href={`/catalog/${c.slug}`} className={cls(active === c.slug)}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
