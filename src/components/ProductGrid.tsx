import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";

/** `priorityCount`: how many leading images load eagerly (above the fold). */
export function ProductGrid({ products, priorityCount = 0 }: { products: CatalogProduct[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
