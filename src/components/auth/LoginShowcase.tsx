"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { MonogramPlate, OrbitPlate } from "@/components/dish-orbit/OrbitPlate";
import { useAutoplay } from "@/components/dish-orbit/use-autoplay";

export interface ShowcaseSlide {
  key: string;
  eyebrow: string;
  title: string;
  text: string | null;
  /** Hex colour the backdrop and arcs take while this slide is on stage. */
  accent: string;
  /** Dish photo; the slide without one shows Kai's monogram plate. */
  imageUrl: string | null;
}

const SECONDS = 4.5;
const ARCS = [
  { inset: "-9%", dash: "border-dashed", mix: 50, spin: 46 },
  { inset: "-20%", dash: "border-dotted", mix: 32, spin: -30 },
];

/**
 * Brand side of the login page: the home-page orbit plates on a slow
 * auto-rotation — Kai's monogram first, then the current hero dishes.
 */
export function LoginShowcase({ slides }: { slides: ShowcaseSlide[] }) {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const step = useCallback(() => setIndex((i) => (i + 1) % slides.length), [slides.length]);
  const { stopped, toggle, rootHandlers } = useAutoplay({
    rootRef,
    barRef,
    seconds: SECONDS,
    step,
    canStep: () => slides.length > 1,
    restartKey: index,
  });
  const active = slides[index];

  return (
    <section
      ref={rootRef}
      {...rootHandlers}
      aria-roledescription="carousel"
      aria-label="המטבח של קאי"
      style={{ "--accent": active.accent } as CSSProperties}
      className="relative flex h-full items-center gap-5 overflow-hidden bg-[color-mix(in_oklab,var(--accent)_13%,var(--color-cream))] px-5 py-6 transition-colors duration-700 lg:flex-col lg:justify-center lg:gap-10 lg:px-12 lg:py-16"
    >
      {/* the plates */}
      <div className="relative size-28 shrink-0 sm:size-36 lg:size-[min(22rem,34vh)]">
        {ARCS.map((a) => (
          <span
            key={a.inset}
            aria-hidden
            className={`absolute rounded-full border-2 ${a.dash} transition-transform duration-1000 ease-out motion-reduce:transition-none`}
            style={{
              inset: a.inset,
              borderColor: `color-mix(in oklab, var(--accent) ${a.mix}%, transparent)`,
              transform: `rotate(${index * a.spin}deg)`,
            }}
          />
        ))}
        {slides.map((s, i) => (
          <div
            key={s.key}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition duration-700 ease-out motion-reduce:transition-none ${
              i === index ? "rotate-0 scale-100 opacity-100" : "rotate-[-24deg] scale-90 opacity-0"
            }`}
          >
            {s.imageUrl ? <OrbitPlate src={s.imageUrl} alt={s.title} priority={i === 1} /> : <MonogramPlate />}
          </div>
        ))}
      </div>

      {/* the captions — stacked in one cell so the block keeps the tallest height */}
      <div className="min-w-0 flex-1 lg:w-full lg:max-w-md lg:flex-none lg:text-center">
        <div className="grid">
          {slides.map((s, i) => (
            <div
              key={s.key}
              aria-hidden={i !== index}
              className={`col-start-1 row-start-1 transition duration-500 motion-reduce:transition-none ${
                i === index ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0"
              }`}
            >
              <p className="text-xs font-bold text-[color-mix(in_oklab,var(--accent)_75%,black)]">{s.eyebrow}</p>
              <p className="mt-1 font-display text-xl font-bold leading-tight sm:text-2xl lg:text-4xl">{s.title}</p>
              {s.text && <p className="mt-3 hidden text-sm leading-relaxed text-muted lg:line-clamp-3 lg:block">{s.text}</p>}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3 lg:mt-8 lg:justify-center">
          <button
            type="button"
            onClick={toggle}
            aria-label={stopped ? "הפעלת המצגת" : "השהיית המצגת"}
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-paper/80 text-ink ring-1 ring-line transition hover:bg-paper"
          >
            {stopped ? <Play className="size-3" aria-hidden /> : <Pause className="size-3" aria-hidden />}
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={s.title}
                aria-current={i === index}
                className={`h-1.5 overflow-hidden rounded-full bg-ink/15 transition-all duration-500 ${i === index ? "w-8" : "w-1.5 hover:bg-ink/30"}`}
              >
                {i === index && (
                  <span ref={barRef} className="block h-full w-full origin-right scale-x-0 rounded-full bg-[color-mix(in_oklab,var(--accent)_85%,black)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
