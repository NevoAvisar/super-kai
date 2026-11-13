"use client";

import { useRef, useState } from "react";
import { CHEF, type OrbitDish } from "@/data/dish-orbit";
import { formatILS } from "@/lib/money";
import { useCart } from "@/store/cart";
import { useHydrated } from "@/lib/use-hydrated";
import { DietaryBadge } from "../DietaryBadge";
import { QuantityStepper } from "../QuantityStepper";
import type { DishLike } from "./use-dish-likes";

const likeCount = new Intl.NumberFormat("he-IL", { notation: "compact" });

type Tab = "overview" | "ingredients";
export function DishDetailsCard({ dish, like }: { dish: OrbitDish; like: DishLike }) {
  const { product } = dish;
  const [tab, setTab] = useState<Tab>("overview");
  const hydrated = useHydrated();
  const item = useCart((s) => s.items[product.id]);
  const { add, increment, decrement } = useCart.getState();
  const videoRef = useRef<HTMLDialogElement>(null);
  const isKg = product.saleUnit === "KG";

  const tabBtn = (t: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      id={`dish-tab-${t}`}
      aria-selected={tab === t}
      aria-controls={`dish-panel-${t}`}
      onClick={() => setTab(t)}
      className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
        tab === t ? "bg-ink text-paper" : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="rounded-[28px] bg-paper p-5 shadow-[0_24px_60px_-34px_rgba(60,40,20,0.45)] ring-1 ring-line sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="פרטי המנה" className="flex gap-1 rounded-full bg-cream p-1">
          {tabBtn("overview", "סקירה")}
          {dish.ingredients.length > 0 && tabBtn("ingredients", "רכיבים")}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {dish.trending && (
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold text-paper">🔥 הכי מבוקש כרגע</span>
          )}
          {dish.signature && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-ink ring-1 ring-inset ring-[color-mix(in_oklab,var(--accent)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent)_16%,white)]">
              ★ מנת הדגל
            </span>
          )}
          {product.promoLabel && (
            <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-[11px] font-bold text-white">{product.promoLabel}</span>
          )}
          {product.dietary.map((t) => (
            <DietaryBadge key={t} tag={t} />
          ))}
        </div>
      </div>

      <div data-reveal className="mt-4 min-h-[7.5rem]">
        {tab === "overview" || dish.ingredients.length === 0 ? (
          <div id="dish-panel-overview" role="tabpanel" aria-labelledby="dish-tab-overview" className="space-y-2">
            {product.description && <p className="line-clamp-3 leading-relaxed">{product.description}</p>}
            {dish.servingGuide && <p className="line-clamp-2 text-sm text-muted">{dish.servingGuide}</p>}
            <p className="flex flex-wrap gap-x-3 text-xs text-muted">
              {product.unitLabel && <span>{product.unitLabel}</span>}
              {product.pricePer100gAgorot !== null && <span>{formatILS(product.pricePer100gAgorot)} ל-100 גרם</span>}
            </p>
          </div>
        ) : (
          <ul
            id="dish-panel-ingredients"
            role="tabpanel"
            aria-labelledby="dish-tab-ingredients"
            className="flex flex-wrap gap-2"
          >
            {dish.ingredients.map((ing) => (
              <li key={ing} className="rounded-full bg-cream px-3 py-1 text-sm ring-1 ring-line">
                {ing}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-ink bg-[color-mix(in_oklab,var(--accent)_28%,white)]"
        >
          {CHEF.initial}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="font-bold">השף {CHEF.name}</p>
          <p className="text-xs text-muted">
            {CHEF.role} · {CHEF.note}
          </p>
        </div>
        <button
          type="button"
          onClick={like.toggle}
          aria-pressed={like.liked}
          aria-label={`${like.liked ? "ביטול אהבתי" : "אהבתי"}${like.count ? ` · ${like.count} אהבו` : ""}`}
          className={`ms-auto flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold ring-1 transition active:scale-95 ${
            like.liked ? "bg-brand-50 text-brand-600 ring-brand-500/40" : "text-muted ring-line hover:text-ink"
          }`}
        >
          <span aria-hidden className={`text-base transition-transform ${like.liked ? "scale-110" : ""}`}>
            {like.liked ? "♥" : "♡"}
          </span>
          {like.count === null ? (
            <span className="inline-block h-3 w-5 animate-pulse rounded bg-line" />
          ) : like.count > 0 ? (
            <span className="tabular-nums">{likeCount.format(like.count)}</span>
          ) : (
            "אהבתי?"
          )}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {hydrated && item ? (
          <div className="min-w-[13rem] flex-1">
            <QuantityStepper
              quantity={item.quantity}
              saleUnit={item.saleUnit}
              onIncrement={() => increment(product.id)}
              onDecrement={() => decrement(product.id)}
            />
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
            className="flex-1 rounded-full bg-ink px-6 py-3 font-bold text-paper transition hover:bg-brand-500 active:scale-[0.98]"
          >
            להזמנה{isKg && <span className="font-normal opacity-70"> · 0.25 ק״ג</span>}
          </button>
        )}
        {dish.videoUrl && (
          <>
            <button
              type="button"
              onClick={() => videoRef.current?.showModal()}
              className="flex items-center gap-2 rounded-full px-5 py-3 font-bold ring-1 ring-line transition hover:ring-ink"
            >
              <span aria-hidden>▶</span> צפייה בהכנה
            </button>
            <dialog
              ref={videoRef}
              onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
              onClose={(e) => e.currentTarget.querySelector("video")?.pause()}
              className="m-auto w-[min(92vw,960px)] overflow-hidden rounded-3xl bg-ink p-0 backdrop:bg-black/70"
            >
              <video src={dish.videoUrl} controls playsInline preload="none" className="block w-full" />
            </dialog>
          </>
        )}
      </div>
    </div>
  );
}
