"use client";

import { useState, type ReactNode } from "react";

/**
 * Small chart kit for the admin dashboard, plain HTML/SVG (no chart library).
 * Colours come from the --color-viz-* tokens in globals.css: a fixed-order
 * categorical palette; text always stays in ink / muted.
 */

/** Categorical series colours in their fixed order; anything past the list folds into "others" (gray). */
export const SERIES = ["var(--color-viz-blue)", "var(--color-viz-orange)", "var(--color-viz-aqua)", "var(--color-viz-yellow)", "var(--color-viz-magenta)", "var(--color-viz-green)"];
export const OTHERS = "var(--color-viz-gray)";

export function ChartCard({ title, note, children, className = "" }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl bg-paper p-5 ring-1 ring-line sm:p-6 ${className}`}>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function niceMax(value: number, integer: boolean): number {
  if (value <= 0) return integer ? 2 : 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const step = [1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((m) => m * pow >= value)! * pow;
  return integer && step % 2 ? step + 1 : step;
}

export interface BarDatum {
  key: string;
  label: string;
  title: string;
  value: number;
}

/**
 * One series over time as thin bars. Time runs left to right even in the RTL
 * page (the chart is its own LTR island). Every bar is focusable and shows its
 * value on hover or focus.
 */
export function BarChart({ data, format, color, integer = false, label }: {
  data: BarDatum[];
  format: (value: number) => string;
  color: string;
  integer?: boolean;
  label: string;
}) {
  const max = niceMax(Math.max(...data.map((d) => d.value)), integer);
  const dense = data.length > 8;
  return (
    <div dir="ltr" className="grid grid-cols-[auto_1fr] gap-x-2">
      <div className="relative h-44 w-10 text-[11px] text-muted" aria-hidden>
        {[1, 0.5, 0].map((t) => (
          <span key={t} className="absolute right-0 -translate-y-1/2 tabular-nums" style={{ top: `${(1 - t) * 100}%` }}>
            {format(max * t)}
          </span>
        ))}
      </div>
      <div className="relative h-44">
        {[0, 0.5, 1].map((t) => (
          <span key={t} className={`absolute inset-x-0 border-t ${t === 1 ? "border-ink/25" : "border-line"}`} style={{ top: `${t * 100}%` }} aria-hidden />
        ))}
        <ul aria-label={label} className="absolute inset-0 flex items-end gap-[2px]">
          {data.map((d, i) => (
            <li
              key={d.key}
              tabIndex={0}
              aria-label={`${d.title}: ${format(d.value)}`}
              className="group relative flex h-full flex-1 items-end justify-center outline-none"
            >
              <span
                className="w-full max-w-7 rounded-t transition-[filter] group-hover:brightness-110 group-focus-visible:ring-2 group-focus-visible:ring-ink"
                style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0, background: color }}
              />
              <span
                role="tooltip"
                className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-center text-xs text-paper shadow-lg group-hover:block group-focus-visible:block ${
                  i < 2 ? "left-0" : i > data.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2"
                }`}
              >
                <b className="block tabular-nums">{format(d.value)}</b>
                <span className="opacity-75">{d.title}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <span />
      <div className="mt-1.5 flex gap-[2px] text-[11px] text-muted" aria-hidden>
        {data.map((d, i) => (
          <span key={d.key} className={`flex-1 truncate text-center ${dense && i % 2 !== (data.length - 1) % 2 ? "invisible" : ""}`}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface DonutSlice {
  key: string;
  name: string;
  value: number;
  color: string;
}

/** Share of a total. The legend carries every name and value, so nothing depends on colour or hover alone. */
export function Donut({ slices, format, centerLabel }: { slices: DonutSlice[]; format: (value: number) => string; centerLabel: string }) {
  const [active, setActive] = useState<string | null>(null);
  const total = slices.reduce((n, s) => n + s.value, 0);
  const R = 46;
  const C = 2 * Math.PI * R;
  const GAP = slices.length > 1 ? 1.6 : 0;
  let start = 0;
  const arcs = slices.map((s) => {
    const length = total ? (s.value / total) * C : 0;
    const arc = { ...s, length, start };
    start += length;
    return arc;
  });
  const shown = arcs.find((a) => a.key === active);
  const percent = (value: number) => (total ? Math.round((value / total) * 100) : 0);

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
      <div className="relative mx-auto size-44">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-line)" strokeWidth="15" />
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.key ? 18 : 15}
              strokeDasharray={`${Math.max(0, a.length - GAP)} ${C}`}
              strokeDashoffset={-a.start}
              opacity={active && active !== a.key ? 0.35 : 1}
              className="transition-all"
              onPointerEnter={() => setActive(a.key)}
              onPointerLeave={() => setActive(null)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="font-display text-xl font-bold tabular-nums">{format(shown ? shown.value : total)}</span>
          <span className="line-clamp-2 text-[11px] leading-tight text-muted">{shown ? `${shown.name} · ${percent(shown.value)}%` : centerLabel}</span>
        </div>
      </div>
      <ul className="space-y-1 text-sm">
        {arcs.map((a) => (
          <li
            key={a.key}
            tabIndex={0}
            onPointerEnter={() => setActive(a.key)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(a.key)}
            onBlur={() => setActive(null)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 outline-none transition ${active === a.key ? "bg-cream" : ""}`}
          >
            <span className="size-3 shrink-0 rounded-[4px]" style={{ background: a.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{a.name}</span>
            <span className="font-bold tabular-nums">{format(a.value)}</span>
            <span className="w-9 text-left text-xs text-muted tabular-nums">{percent(a.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface StackRow {
  key: string;
  label: string;
  segments: { key: string; label: string; value: number; color: string }[];
}

/** Horizontal stacked bars with a legend and the row total written out. */
export function StackedBars({ rows, legend, unit }: { rows: StackRow[]; legend: { label: string; color: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.segments.reduce((n, s) => n + s.value, 0)));
  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {legend.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span className="size-3 rounded-[4px]" style={{ background: l.color }} aria-hidden />
            {l.label}
          </li>
        ))}
      </ul>
      <ul className="space-y-3">
        {rows.map((r) => {
          const total = r.segments.reduce((n, s) => n + s.value, 0);
          return (
            <li key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 font-bold tabular-nums">
                  {total} <span className="text-xs font-normal text-muted">{unit}</span>
                </span>
              </div>
              <div className="mt-1.5 flex h-3 gap-[2px]" style={{ width: `${Math.max(4, (total / max) * 100)}%` }}>
                {r.segments.filter((s) => s.value > 0).map((s) => (
                  <span
                    key={s.key}
                    title={`${s.label}: ${s.value}`}
                    className="h-full rounded-[4px] transition-[filter] hover:brightness-110"
                    style={{ flexGrow: s.value, background: s.color }}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Pill toggle used for the period and the view switches. */
export function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; badge?: number }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-paper p-1 text-sm font-bold ring-1 ring-line">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`shrink-0 rounded-full px-4 py-1.5 transition ${value === o.value ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
        >
          {o.label}
          {o.badge !== undefined && <span className="ms-1.5 tabular-nums opacity-70">{o.badge}</span>}
        </button>
      ))}
    </div>
  );
}
