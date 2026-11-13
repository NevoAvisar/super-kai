"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import type { OrbitDish } from "@/data/dish-orbit";
import { formatILS } from "@/lib/money";
import { OrbitPlate } from "./OrbitPlate";
import { DishDetailsCard } from "./DishDetailsCard";
import { useDishLikes } from "./use-dish-likes";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** How far (deg) a plate travels around the pivot when leaving / arriving. */
const SWING = 118;
/** Each arc turns by a different amount per step, so they drift against each other. */
const ARCS = [
  { size: 1.22, width: 2, dash: "34 66", mix: 55, spin: 52 },
  { size: 1.42, width: 1.25, dash: "58 42", mix: 38, spin: -36 },
  { size: 1.66, width: 1, dash: "22 78", mix: 26, spin: 24 },
];
/** Scroll distance per dish while pinned, as a fraction of the viewport height. */
const STEP_VH = 0.75;
const PIN_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

/**
 * Home-page hero: signature dishes on plates that swing around a wide orbit.
 *  • desktop: the section pins; scrolling / wheel steps through the dishes
 *  • everywhere: side dots, arrow keys, and touch / pointer swipes
 *  • only transforms, opacity and one CSS variable are animated (GPU friendly)
 */
export function DishOrbitCarousel({ dishes }: { dishes: OrbitDish[] }) {
  const n = dishes.length;
  const [active, setActive] = useState(0);
  const likeFor = useDishLikes(dishes.map((d) => d.product.id));
  const rootRef = useRef<HTMLElement>(null);
  const armsRef = useRef<(HTMLDivElement | null)[]>([]);
  const platesRef = useRef<(HTMLDivElement | null)[]>([]);
  const arcsRef = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLSpanElement>(null);
  const current = useRef(0);
  const stRef = useRef<ScrollTrigger | null>(null);
  const scrollingTo = useRef(false); // ignore pin updates during a programmatic scroll
  const reduced = useRef(false);
  const shown = useRef(0); // dish whose title is currently revealed

  /** Swing the stage from the current dish to `to`. */
  const animateTo = useCallback(
    (to: number) => {
      const from = current.current;
      if (to === from || to < 0 || to >= n) return;
      const dir = to > from ? 1 : -1;
      const d = reduced.current ? 0 : 1;
      current.current = to;
      setActive(to);

      const arms = armsRef.current;
      const plates = platesRef.current;
      arms.forEach((arm, i) => {
        if (arm && i !== from && i !== to) {
          gsap.killTweensOf(arm);
          gsap.set(arm, { autoAlpha: 0, rotation: 0 });
        }
      });
      gsap.killTweensOf([arms[from], arms[to], plates[from], plates[to]]);

      // Outgoing plate: up and over the top, spinning as it goes.
      gsap.to(arms[from], { rotation: SWING * dir, duration: 0.95 * d, ease: "power2.in" });
      gsap.to(arms[from], { autoAlpha: 0, duration: 0.3 * d, delay: 0.55 * d });
      gsap.to(plates[from], { rotation: 80 * dir, duration: 0.95 * d, ease: "power2.in" });
      // Incoming plate: swings up from the opposite side and settles.
      gsap.fromTo(
        arms[to],
        { rotation: -SWING * dir, autoAlpha: 1 },
        { rotation: 0, duration: 1.15 * d, delay: 0.2 * d, ease: "power3.out" },
      );
      gsap.fromTo(plates[to], { rotation: -80 * dir }, { rotation: 0, duration: 1.15 * d, delay: 0.2 * d, ease: "power3.out" });

      arcsRef.current.forEach((arc, k) =>
        gsap.to(arc, { rotation: `+=${ARCS[k].spin * dir}`, duration: 1.4 * d, ease: "expo.out" }),
      );
      gsap.to(rootRef.current, { "--accent": dishes[to].accent, duration: 0.9 * d, ease: "power1.inOut" });
    },
    [dishes, n],
  );

  /** Go to a dish from dots / keys / swipe. While pinned, also move the scroll position. */
  const goTo = useCallback(
    (i: number) => {
      const to = Math.max(0, Math.min(n - 1, i));
      const st = stRef.current;
      animateTo(to);
      if (!st) return;
      scrollingTo.current = true;
      gsap.to(window, {
        scrollTo: { y: st.start + (st.end - st.start) * (to / (n - 1)), autoKill: true },
        duration: 0.9,
        ease: "power2.inOut",
        overwrite: true,
        onComplete: () => void (scrollingTo.current = false),
        onInterrupt: () => void (scrollingTo.current = false),
      });
    },
    [animateTo, n],
  );

  // Pinning (desktop only, motion allowed) + reduced-motion detection.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const header = document.querySelector("header");
    const headerH = () => header?.offsetHeight ?? 0;
    const syncHeader = () => root.style.setProperty("--hh", `${headerH()}px`);
    syncHeader();
    window.addEventListener("resize", syncHeader);

    const mm = gsap.matchMedia();
    mm.add({ reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
      reduced.current = !!ctx.conditions?.reduce;
    });
    if (n > 1) {
      mm.add(PIN_QUERY, () => {
        const st = ScrollTrigger.create({
          trigger: root,
          start: () => `top top+=${headerH()}`,
          end: () => `+=${window.innerHeight * STEP_VH * (n - 1)}`,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.05, ease: "power1.inOut" },
          onRefreshInit: syncHeader,
          onUpdate: (self) => {
            if (!scrollingTo.current) animateTo(Math.round(self.progress * (n - 1)));
          },
        });
        stRef.current = st;
        animateTo(Math.round(st.progress * (n - 1))); // page restored mid-scroll
        return () => void (stRef.current = null);
      });
    }
    return () => {
      mm.revert();
      window.removeEventListener("resize", syncHeader);
    };
  }, [n, animateTo]);

  // Dual-weight title wipe + copy reveal whenever the dish changes.
  useIsoLayoutEffect(() => {
    if (shown.current === active) return; // initial render (and StrictMode re-runs)
    shown.current = active;
    const d = reduced.current ? 0 : 1;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        fillRef.current,
        { clipPath: "inset(0% 0% 0% 100%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9 * d, delay: 0.15 * d, ease: "power3.inOut" },
      );
      gsap.fromTo(
        "[data-reveal]",
        { y: 14, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6 * d, delay: 0.25 * d, stagger: 0.06 * d, ease: "power2.out" },
      );
    }, rootRef);
    return () => ctx.kill();
  }, [active]);

  // Arrow keys: while the section is pinned, or when focus is inside it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable], dialog")) return;
      const pinned = !!stRef.current?.isActive;
      const focused = root.contains(document.activeElement);
      if (!pinned && !focused) return;
      // RTL: "next" is to the left.
      const step =
        e.key === "ArrowLeft" || (pinned && (e.key === "ArrowDown" || e.key === "PageDown"))
          ? 1
          : e.key === "ArrowRight" || (pinned && (e.key === "ArrowUp" || e.key === "PageUp"))
            ? -1
            : 0;
      const to = current.current + step;
      if (!step || to < 0 || to >= n) return; // let the page scroll past the ends
      e.preventDefault();
      goTo(to);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, n]);

  // Touch / pointer swipe on the stage (vertical scrolling stays native).
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => void (swipe.current = { x: e.clientX, y: e.clientY });
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    goTo(current.current + (dx > 0 ? 1 : -1)); // RTL: drag right → next
  };

  if (n === 0) return null;
  const dish = dishes[active];
  const { product } = dish;
  const onSale = product.priceAgorot < product.listPriceAgorot;
  const pad = (k: number) => String(k).padStart(2, "0");

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="מנות הדגל של קאי"
      style={{ "--accent": dishes[0].accent } as CSSProperties}
      className="relative overflow-hidden border-b border-line bg-cream lg:h-[calc(100svh-var(--hh,7rem))] lg:min-h-[640px]"
    >
      {/* soft accent wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_28%_55%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)]"
      />

      <div className="relative mx-auto grid h-full max-w-7xl items-center gap-6 px-4 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 lg:py-8">
        {/* Copy + details (right side in RTL) */}
        <div className="relative z-10 space-y-4 lg:space-y-5">
          <h1 className="text-sm font-light tracking-wide text-muted">
            <span className="font-bold text-ink">סופר-קאי</span> · אוכל של בית, ברמה של מעדנייה
          </h1>
          <p className="flex items-center gap-3 text-sm" aria-live="polite">
            <span className="font-bold" style={{ color: "color-mix(in oklab, var(--accent) 75%, black)" }}>
              {dish.categoryName}
            </span>
            <span className="h-px w-8 bg-line" />
            <span className="font-display tabular-nums text-muted">
              <span className="font-bold text-ink">{pad(active + 1)}</span> / {pad(n)}
            </span>
          </p>

          {/* Dual-weight wipe: hairline outline underneath, solid fill wipes across it */}
          <h2 className="relative font-display text-[2.4rem] font-black leading-[1.02] sm:text-5xl xl:text-6xl">
            <span className="block text-transparent [-webkit-text-stroke:1px_var(--color-ink)] opacity-35">
              {product.name}
            </span>
            <span ref={fillRef} aria-hidden className="absolute inset-0 block text-ink">
              {product.name}
            </span>
          </h2>

          <div data-reveal className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {dish.nameEn && (
              <p dir="ltr" className="font-display text-lg italic text-muted">
                {dish.nameEn}
              </p>
            )}
            <p className="flex items-baseline gap-1.5">
              <span className={`font-display text-3xl font-bold ${onSale ? "text-brand-600" : ""}`}>
                {formatILS(product.priceAgorot)}
              </span>
              <span className="text-sm text-muted">{product.saleUnit === "KG" ? "/ ק״ג" : "/ יח׳"}</span>
              {onSale && <span className="text-sm text-muted line-through">{formatILS(product.listPriceAgorot)}</span>}
            </p>
          </div>

          <DishDetailsCard dish={dish} like={likeFor(product.id)} />

          <Link href="/catalog" className="inline-block text-sm font-bold text-brand-600 hover:underline">
            לכל התפריט ←
          </Link>
        </div>

        {/* Stage (left side in RTL, first on mobile) */}
        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => void (swipe.current = null)}
          className="relative order-first aspect-[1/0.92] w-full touch-pan-y select-none [--pivot:165%_50%] [--plate-w:min(64%,22rem)] [--plate-x:50%] lg:order-none lg:aspect-auto lg:h-full lg:[--pivot:135%_50%] lg:[--plate-w:min(74%,58svh)] lg:[--plate-x:44%]"
        >
          {/* pastel arcs */}
          {ARCS.map((a, k) => (
            <div
              key={k}
              ref={(el) => void (arcsRef.current[k] = el)}
              aria-hidden
              className="pointer-events-none absolute top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
              style={{ left: "var(--plate-x)", width: `calc(var(--plate-w) * ${a.size})` }}
            >
              <svg
                viewBox="0 0 100 100"
                className="h-full w-full animate-[spin_70s_linear_infinite] motion-reduce:animate-none"
                style={{ animationDirection: k % 2 ? "reverse" : "normal" }}
              >
                <circle
                  cx="50"
                  cy="50"
                  r="49"
                  fill="none"
                  pathLength={100}
                  strokeDasharray={a.dash}
                  strokeLinecap="round"
                  strokeWidth={a.width * 2}
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: `color-mix(in oklab, var(--accent) ${a.mix}%, white)` }}
                />
              </svg>
            </div>
          ))}

          {/* one orbit arm per dish; only the active one is visible at rest */}
          {dishes.map((d, i) => (
            <div
              key={d.product.id}
              ref={(el) => void (armsRef.current[i] = el)}
              aria-hidden={i !== active}
              className="pointer-events-none absolute inset-0 will-change-transform"
              style={{ transformOrigin: "var(--pivot)", opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
            >
              <div
                className="absolute top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
                style={{ left: "var(--plate-x)", width: "var(--plate-w)" }}
              >
                <div ref={(el) => void (platesRef.current[i] = el)} className="h-full w-full">
                  <OrbitPlate src={d.product.imageUrl!} alt={d.product.name} priority={i === 0} />
                </div>
              </div>
            </div>
          ))}

          {/* pager dots: vertical on the outer edge (desktop), row under the plate (mobile) */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center gap-2 lg:inset-x-auto lg:bottom-auto lg:end-0 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col">
            {dishes.map((d, i) => (
              <button
                key={d.product.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={d.product.name}
                aria-current={i === active}
                className="group flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`block rounded-full transition-all duration-500 ${
                    i === active ? "h-2.5 w-6 lg:h-6 lg:w-2.5" : "h-2 w-2 bg-ink/20 group-hover:bg-ink/40"
                  }`}
                  style={i === active ? { background: "color-mix(in oklab, var(--accent) 80%, black)" } : undefined}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
