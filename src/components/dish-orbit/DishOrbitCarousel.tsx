"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { CHEF, WELCOME, type OrbitDish } from "@/data/dish-orbit";
import { formatILS } from "@/lib/money";
import { MonogramPlate, OrbitPlate } from "./OrbitPlate";
import { DishDetailsCard } from "./DishDetailsCard";
import { useDishLikes } from "./use-dish-likes";
import { useAutoplay } from "./use-autoplay";
import { useLiveCatalog } from "@/lib/use-live-catalog";

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
/** Scroll distance per slide while pinned, as a fraction of the viewport height. */
const STEP_VH = 0.7;
/** Autoplay interval, seconds. */
const AUTOPLAY_S = 5;
const PIN_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const pad = (k: number) => String(k).padStart(2, "0");
/** True while a tween is still scheduled (killed / finished tweens are dropped by GSAP). */
const isRunning = (t: gsap.core.Tween | null) => !!t && gsap.getTweensOf(window).includes(t);

/**
 * The home page: one orbit carousel. Slide 1 is Kai's welcome & story, the
 * rest are the most popular dishes of each category (see hero-dishes.ts).
 *  • desktop: the section pins; scrolling steps through the slides, then releases
 *  • arrows, swipes and focused arrow keys loop endlessly (last → first keeps orbiting forward)
 *  • autoplay every 5 s; pauses on hover, keyboard focus, hidden tab, off-screen, or the pause button
 *  • only transforms, opacity and one CSS variable are animated (GPU friendly)
 */
export function DishOrbitCarousel({ dishes: baseDishes }: { dishes: OrbitDish[] }) {
  // Local admin edits (name, price, promotion) show on the slides; the line-up itself stays as the server picked it.
  const baseProducts = useMemo(() => baseDishes.map((d) => d.product), [baseDishes]);
  const liveProducts = useLiveCatalog(baseProducts);
  const dishes = useMemo(() => {
    if (liveProducts === baseProducts) return baseDishes;
    const byId = new Map(liveProducts.map((p) => [p.id, p]));
    // QA fix: a dish the admin hid (missing from the live list) or marked sold out
    // used to stay on the hero with a working "add" path. It now drops out.
    // HE: מנה שהוסתרה או אזלה יורדת מהקרוסלה (בעבר נשארה מוצגת).
    return baseDishes.flatMap((d) => {
      const product = byId.get(d.product.id);
      return product && product.inStock ? [{ ...d, product }] : [];
    });
  }, [baseDishes, baseProducts, liveProducts]);
  const n = dishes.length + 1; // welcome + dishes
  const accents = useMemo(() => [WELCOME.accent, ...dishes.map((d) => d.accent)], [dishes]);
  const [active, setActive] = useState(0);
  const likeFor = useDishLikes(dishes.map((d) => d.product.id));
  const rootRef = useRef<HTMLElement>(null);
  const armsRef = useRef<(HTMLDivElement | null)[]>([]);
  const platesRef = useRef<(HTMLDivElement | null)[]>([]);
  const arcsRef = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLSpanElement>(null);
  const current = useRef(0);
  const stRef = useRef<ScrollTrigger | null>(null);
  const scrollTween = useRef<gsap.core.Tween | null>(null); // pin updates are ignored while this runs
  const reduced = useRef(false);
  const shown = useRef(0); // slide whose title is currently revealed
  const barRef = useRef<HTMLSpanElement>(null);

  /** Category chips: welcome + the first slide of each category. */
  const chapters = useMemo(() => {
    const list = [{ label: "ברוכים הבאים", start: 0, end: 0 }];
    dishes.forEach((d, i) => {
      const last = list[list.length - 1];
      if (list.length > 1 && last.label === d.categoryName) last.end = i + 1;
      else list.push({ label: d.categoryName, start: i + 1, end: i + 1 });
    });
    return list;
  }, [dishes]);

  /** Swing the stage to slide `to`. `dir` defaults to the shorter direction in index order. */
  const animateTo = useCallback(
    (to: number, dirOverride?: 1 | -1) => {
      const from = current.current;
      if (to === from || to < 0 || to >= n) return;
      const dir = dirOverride ?? (to > from ? 1 : -1);
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
      gsap.to(rootRef.current, { "--accent": accents[to], duration: 0.9 * d, ease: "power1.inOut" });
    },
    [accents, n],
  );

  /** Go to a slide. While pinned, also move the scroll position to match. */
  const goTo = useCallback(
    (i: number, dir?: 1 | -1) => {
      const to = ((i % n) + n) % n; // endless
      if (to === current.current) return;
      const st = stRef.current;
      const hops = Math.abs(to - current.current);
      animateTo(to, dir);
      if (!st) return;
      scrollTween.current = gsap.to(window, {
        // autoKill off: ScrollTrigger's own pin/snap adjustments would otherwise cancel the tween mid-way.
        scrollTo: { y: st.start + (st.end - st.start) * (to / (n - 1)), autoKill: false },
        duration: Math.min(1.6, 0.6 + hops * 0.12),
        ease: "power2.inOut",
        overwrite: true,
      });
    },
    [animateTo, n],
  );
  const next = useCallback(() => goTo(current.current + 1, 1), [goTo]);
  const prev = useCallback(() => goTo(current.current - 1, -1), [goTo]);

  // Desktop: only advance while the pinned section fills the screen, so autoplay
  // never scrolls a visitor who has moved on to the rest of the page.
  const autoplay = useAutoplay({
    rootRef,
    barRef,
    seconds: AUTOPLAY_S,
    step: next,
    canStep: () => {
      const st = stRef.current;
      // Inclusive: on the last slide the scroll sits exactly at `end`, where isActive is false.
      return !st || (st.scroll() >= st.start - 2 && st.scroll() <= st.end + 2);
    },
    restartKey: active,
  });

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
          if (!isRunning(scrollTween.current)) animateTo(Math.round(self.progress * (n - 1)));
        },
      });
      stRef.current = st;
      animateTo(Math.round(st.progress * (n - 1))); // page restored mid-scroll
      return () => void (stRef.current = null);
    });
    return () => {
      mm.revert();
      window.removeEventListener("resize", syncHeader);
    };
  }, [n, animateTo]);

  // Dual-weight title wipe + copy reveal whenever the slide changes.
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

  // Arrow keys. Pinned: step through, and let the page scroll on past either end.
  // Focus inside the carousel (not pinned): loop endlessly.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable], dialog, [role=tab]")) return;
      const pinned = !!stRef.current?.isActive;
      if (!pinned && !root.contains(document.activeElement)) return;
      // RTL: "next" is to the left.
      const step =
        e.key === "ArrowLeft" || (pinned && (e.key === "ArrowDown" || e.key === "PageDown"))
          ? 1
          : e.key === "ArrowRight" || (pinned && (e.key === "ArrowUp" || e.key === "PageUp"))
            ? -1
            : 0;
      if (!step) return;
      const to = current.current + step;
      if (pinned && (to < 0 || to >= n)) return;
      e.preventDefault();
      goTo(to, step);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, n]);

  // Touch / pointer swipe on the stage (vertical scrolling stays native).
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx > 0) next(); // RTL: drag right → next
    else prev();
  };

  const dish = active > 0 ? dishes[active - 1] : null;
  const title = dish ? dish.product.name : WELCOME.title;
  const onSale = dish && dish.product.priceAgorot < dish.product.listPriceAgorot;
  const arrowBtn =
    "flex h-11 w-11 items-center justify-center rounded-full bg-paper/90 text-lg text-ink shadow-sm ring-1 ring-line transition hover:bg-ink hover:text-paper active:scale-95";

  return (
    <section
      {...autoplay.rootHandlers}
      id="about"
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="סופר-קאי – הסיפור והמנות"
      style={{ "--accent": WELCOME.accent } as CSSProperties}
      className="relative scroll-mt-28 overflow-hidden border-b border-line bg-cream lg:h-[calc(100svh-var(--hh,7rem))] lg:min-h-[660px]"
    >
      {/* soft accent wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_28%_55%,color-mix(in_oklab,var(--accent)_22%,transparent),transparent_70%)]"
      />

      <div className="relative mx-auto grid h-full max-w-7xl items-center gap-6 px-4 pb-10 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10 lg:py-8">
        {/* Copy (right side in RTL) */}
        <div className="relative z-10 min-w-0 space-y-4 lg:space-y-5">
          <h1 className="text-sm font-light tracking-wide text-muted">
            <span className="font-bold text-ink">סופר-קאי</span> · {WELCOME.eyebrow}
          </h1>

          {/* category chapters */}
          <nav aria-label="פרקים" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
            <ul className="flex w-max gap-1.5">
              {chapters.map((c) => {
                const on = active >= c.start && active <= c.end;
                return (
                  <li key={c.start}>
                    <button
                      type="button"
                      onClick={() => goTo(c.start)}
                      aria-current={on}
                      className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                        on ? "bg-ink text-paper" : "text-muted ring-1 ring-line hover:text-ink hover:ring-ink/30"
                      }`}
                    >
                      {c.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Dual-weight wipe: hairline outline underneath, solid fill wipes across it */}
          <h2 className="relative font-display text-[2.4rem] font-black leading-[1.02] sm:text-5xl xl:text-6xl">
            <span className="block text-transparent opacity-35 [-webkit-text-stroke:1px_var(--color-ink)]">{title}</span>
            <span ref={fillRef} aria-hidden className="absolute inset-0 block text-ink">
              {title}
            </span>
          </h2>
          <p className="sr-only" data-slide-status aria-live={autoplay.paused ? "polite" : "off"}>
            {`שקופית ${active + 1} מתוך ${n}: ${title}`}
          </p>

          {dish ? (
            <>
              <div data-reveal className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {dish.nameEn && (
                  <p dir="ltr" className="font-display text-lg italic text-muted">
                    {dish.nameEn}
                  </p>
                )}
                <p className="flex items-baseline gap-1.5">
                  <span className={`font-display text-3xl font-bold ${onSale ? "text-brand-600" : ""}`}>
                    {formatILS(dish.product.priceAgorot)}
                  </span>
                  <span className="text-sm text-muted">{dish.product.saleUnit === "KG" ? "/ ק״ג" : "/ יח׳"}</span>
                  {onSale && (
                    <span className="text-sm text-muted line-through">{formatILS(dish.product.listPriceAgorot)}</span>
                  )}
                </p>
              </div>
              <DishDetailsCard dish={dish} like={likeFor(dish.product.id)} />
            </>
          ) : (
            <>
              <p data-reveal className="max-w-xl text-lg leading-relaxed text-muted">
                {WELCOME.story}
              </p>
              <div
                data-reveal
                className="rounded-[28px] bg-paper p-5 shadow-[0_24px_60px_-34px_rgba(60,40,20,0.45)] ring-1 ring-line sm:p-6"
              >
                <ul className="grid gap-4 sm:grid-cols-3">
                  {WELCOME.pillars.map((p) => (
                    <li key={p.title} className="flex gap-3 sm:block">
                      <span aria-hidden className="text-2xl">
                        {p.icon}
                      </span>
                      <div>
                        <p className="font-display text-lg font-bold sm:mt-1">{p.title}</p>
                        <p className="text-sm leading-snug text-muted">{p.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_22%,white)] font-display text-lg font-bold"
                  >
                    {CHEF.initial}
                  </span>
                  <div className="leading-tight">
                    <p className="font-bold">השף {CHEF.name}</p>
                    <p className="text-xs text-muted">{CHEF.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={next}
                    className="ms-auto rounded-full bg-ink px-6 py-3 font-bold text-paper transition hover:bg-brand-500 active:scale-[0.98]"
                  >
                    לגלות את המנות ←
                  </button>
                </div>
              </div>
            </>
          )}

          <Link href="/catalog" className="inline-block text-sm font-bold text-brand-600 hover:underline">
            לכל התפריט ←
          </Link>
        </div>

        {/* Stage (left side in RTL, first on mobile) */}
        <div
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => void (swipe.current = null)}
          className="relative order-first aspect-[1/0.92] w-full touch-pan-y select-none [--pivot:165%_50%] [--plate-w:min(64%,22rem)] [--plate-x:50%] lg:order-none lg:aspect-auto lg:h-full lg:[--pivot:135%_50%] lg:[--plate-w:min(74%,56svh)] lg:[--plate-x:44%]"
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

          {/* one orbit arm per slide; only the active one is visible at rest.
              Perf (QA): no permanent will-change — it kept every hidden arm on its own GPU layer;
              GSAP promotes an arm to 3D only while its tween runs (force3D: "auto"). */}
          {[null, ...dishes].map((d, i) => (
            <div
              key={d?.product.id ?? "welcome"}
              ref={(el) => void (armsRef.current[i] = el)}
              aria-hidden={i !== active}
              className="pointer-events-none absolute inset-0"
              style={{ transformOrigin: "var(--pivot)", opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
            >
              <div
                className="absolute top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2"
                style={{ left: "var(--plate-x)", width: "var(--plate-w)" }}
              >
                <div ref={(el) => void (platesRef.current[i] = el)} className="h-full w-full">
                  {d ? (
                    <OrbitPlate src={d.product.imageUrl!} alt={d.product.name} priority={i === 1} />
                  ) : (
                    <MonogramPlate />
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* prev · counter · next — loops endlessly */}
          <div
            className="absolute bottom-0 z-10 flex -translate-x-1/2 items-center gap-3 lg:bottom-6"
            style={{ left: "var(--plate-x)" }}
          >
            <button type="button" onClick={prev} aria-label="הקודם" className={arrowBtn}>
              →
            </button>
            <span className="flex min-w-[4.5rem] flex-col items-center gap-1.5 font-display tabular-nums text-muted">
              <span>
                <span className="font-bold text-ink">{pad(active + 1)}</span> / {pad(n)}
              </span>
              {/* autoplay countdown (its tween is the timer) */}
              <span aria-hidden className="block h-0.5 w-full overflow-hidden rounded-full bg-ink/10">
                <span
                  ref={barRef}
                  className="block h-full w-full origin-right"
                  style={{ transform: "scaleX(0)", background: "color-mix(in oklab, var(--accent) 80%, black)" }}
                />
              </span>
            </span>
            <button type="button" onClick={next} aria-label="הבא" className={arrowBtn}>
              ←
            </button>
            <button
              type="button"
              onClick={autoplay.toggle}
              aria-label={autoplay.stopped ? "הפעלת מעבר אוטומטי" : "עצירת מעבר אוטומטי"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs text-muted ring-1 ring-line transition hover:text-ink hover:ring-ink/30"
            >
              <span aria-hidden>{autoplay.stopped ? "▶" : "❚❚"}</span>
            </button>
          </div>

          {/* pager dots on the outer edge (desktop) */}
          <div className="absolute end-0 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-1 lg:flex">
            {[WELCOME.title, ...dishes.map((d) => d.product.name)].map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={label}
                aria-current={i === active}
                className="group flex h-6 w-6 items-center justify-center"
              >
                <span
                  className={`block rounded-full transition-all duration-500 ${
                    i === active ? "h-6 w-2.5" : "h-2 w-2 bg-ink/20 group-hover:bg-ink/40"
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
