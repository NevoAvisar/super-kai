"use client";

import type { CatalogProduct } from "@/lib/catalog";
import { formatILS } from "@/lib/money";
import { lineTotal } from "@/lib/pricing";
import { estimateServings } from "@/lib/portion-guide";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { QuantityStepper } from "./QuantityStepper";
import { DietaryBadge } from "./DietaryBadge";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, priority = false }: { product: CatalogProduct; priority?: boolean }) {
  const hydrated = useHydrated();
  const item = useCart((s) => s.items[product.id]);
  const { add, increment, decrement } = useCart.getState();

  const isKg = product.saleUnit === "KG";
  const onSale = product.priceAgorot < product.listPriceAgorot;
  const inCart = hydrated && item;
  const servings = inCart && isKg ? estimateServings(item.quantity, product.portionGroup, product.hasBones) : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[22px] bg-paper ring-1 ring-line transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(60,40,20,0.35)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductImage
          name={product.name}
          imageUrl={product.imageUrl}
          credit={product.imageCredit}
          icon={product.categoryIcon}
          priority={priority}
        />
        {product.promoLabel && (
          <span className="absolute top-3 start-3 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow">
            {product.promoLabel}
          </span>
        )}
        {product.unitLabel && (
          <span className="absolute bottom-3 start-3 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium backdrop-blur">
            {product.unitLabel}
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/60 backdrop-blur-[2px]">
            <span className="rounded-full bg-ink px-4 py-1.5 text-sm font-bold text-paper">אזל להיום</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="space-y-1.5">
          <h3 className="font-display text-xl font-bold leading-tight">{product.name}</h3>
          {product.description && <p className="line-clamp-2 text-sm leading-relaxed text-muted">{product.description}</p>}
        </div>

        {product.dietary.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.dietary.map((t) => (
              <DietaryBadge key={t} tag={t} />
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-display text-2xl font-bold ${onSale ? "text-brand-600" : ""}`}>
                {formatILS(product.priceAgorot)}
              </span>
              <span className="text-xs text-muted">{isKg ? "/ ק״ג" : "/ יח׳"}</span>
            </div>
            {onSale && <span className="text-xs text-muted line-through">{formatILS(product.listPriceAgorot)}</span>}
          </div>
          {product.pricePer100gAgorot !== null && (
            <span className="text-left text-xs leading-tight text-muted">
              {formatILS(product.pricePer100gAgorot)}
              <br />
              ל-100 גרם
            </span>
          )}
        </div>

        {!product.inStock ? (
          <div className="rounded-full bg-line/60 py-2.5 text-center text-sm font-medium text-muted">יחזור מחר</div>
        ) : inCart ? (
          <div className="space-y-1.5">
            <QuantityStepper
              quantity={item.quantity}
              saleUnit={item.saleUnit}
              onIncrement={() => increment(product.id)}
              onDecrement={() => decrement(product.id)}
            />
            <p className="flex justify-between px-1 text-xs text-muted">
              <span>{servings ? `מתאים לכ-${servings} סועדים` : " "}</span>
              <span className="font-bold text-ink tabular-nums">
                {formatILS(lineTotal(item.unitPriceAgorot, item.quantity, item.saleUnit))}
              </span>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              add({
                productId: product.id,
                name: product.name,
                icon: product.categoryIcon,
                imageUrl: product.imageUrl,
                saleUnit: product.saleUnit,
                unitPriceAgorot: product.priceAgorot,
                listPriceAgorot: product.listPriceAgorot,
              })
            }
            className="rounded-full bg-ink py-2.5 text-sm font-bold text-paper transition hover:bg-brand-500 active:scale-[0.98]"
          >
            הוספה לסל{isKg && <span className="font-normal opacity-70"> · 0.25 ק״ג</span>}
          </button>
        )}
      </div>
    </article>
  );
}
