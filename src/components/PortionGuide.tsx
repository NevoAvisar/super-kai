"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { calculatePortions, PORTION_RULES, type Appetite, type MainsKind, type PortionLine } from "@/lib/portion-guide";

interface Props {
  /** Category slugs per course, for the "shop this" links. */
  links?: { firsts?: string; mains?: string; sides?: string };
  variant?: "button" | "link";
  label?: string;
}

/** Trigger + modal. Uses the native <dialog> (Esc to close, focus trap, backdrop). */
export function PortionGuide({ links, variant = "button", label = "כמה להזמין?" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger =
    variant === "button"
      ? "inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-bold ring-1 ring-line transition hover:ring-brand-500"
      : "font-bold text-brand-600 underline-offset-4 hover:underline";

  return (
    <>
      <button type="button" className={trigger} onClick={() => ref.current?.showModal()}>
        <span aria-hidden>⚖️</span> {label}
      </button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(680px,calc(100vw-24px))] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[28px] bg-paper p-0 text-ink shadow-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
        aria-labelledby="portion-guide-title"
      >
        <PortionGuideBody links={links} onClose={() => ref.current?.close()} />
      </dialog>
    </>
  );
}

function Counter({ label, hint, value, onChange, min = 0, max = 99 }: {
  label: string; hint?: string; value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
  const btn = "h-8 w-8 rounded-full text-lg text-brand-600 ring-1 ring-line transition hover:bg-brand-500 hover:text-white disabled:opacity-30";
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={`הוספה – ${label}`}>+</button>
        <span className="w-8 text-center font-bold tabular-nums">{value}</span>
        <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={`הפחתה – ${label}`}>−</button>
      </div>
    </div>
  );
}

function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="grid rounded-full bg-cream p-1 text-sm" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`rounded-full px-2 py-1.5 transition ${value === o.value ? "bg-paper font-bold shadow-sm" : "text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const kg = (n: number) => `${n.toFixed(2)} ק״ג`;

function ResultRow({ title, line, href, note }: { title: string; line: PortionLine | null; href?: string; note?: string }) {
  if (!line) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-xs text-muted">
          {line.gramsPerGuest} גרם לסועד{note ? ` · ${note}` : ""}
          {line.dishes > 1 && ` · ${kg(line.perDishKg)} מכל מנה`}
        </p>
      </div>
      <div className="shrink-0 text-left">
        <p className="whitespace-nowrap font-display text-2xl font-bold tabular-nums">{kg(line.totalKg)}</p>
        {href && (
          <Link href={`/catalog/${href}`} className="whitespace-nowrap text-xs font-bold text-brand-600 hover:underline">
            לבחירת מנות ←
          </Link>
        )}
      </div>
    </div>
  );
}

function PortionGuideBody({ links, onClose }: { links?: Props["links"]; onClose: () => void }) {
  const [guests, setGuests] = useState(10);
  const [appetite, setAppetite] = useState<Appetite>("regular");
  const [salads, setSalads] = useState(4);
  const [mains, setMains] = useState(2);
  const [mainsKind, setMainsKind] = useState<MainsKind>("boneless");
  const [sides, setSides] = useState(2);

  const r = calculatePortions({ guests, appetite, salads, mains, mainsKind, sides });
  const pct = Math.min(100, (r.ediblePerGuest / PORTION_RULES.maxTotalPerGuest) * 100);

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-paper/95 px-6 py-5 backdrop-blur">
        <div>
          <p className="text-xs font-bold tracking-wide text-brand-600">מדריך כמויות</p>
          <h2 id="portion-guide-title" className="font-display text-3xl font-bold">כמה להזמין?</h2>
          <p className="text-sm text-muted">לפי סטנדרט קייטרינג מקצועי. הכמויות מעוגלות לרבע קילו.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-full p-2 text-xl text-muted hover:bg-cream" aria-label="סגירה">
          ✕
        </button>
      </header>

      <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
        {/* Inputs */}
        <section className="space-y-3">
          <div className="divide-y divide-line">
            <Counter label="מספר סועדים" value={guests} onChange={setGuests} min={1} max={200} />
            <Counter label="ראשונות וסלטים" hint="כמה סוגים שונים" value={salads} onChange={setSalads} max={12} />
            <Counter label="מנות עיקריות" hint="כמה סוגים שונים" value={mains} onChange={setMains} max={6} />
            <Counter label="ירקות ותוספות" hint="כמה סוגים שונים" value={sides} onChange={setSides} max={6} />
          </div>
          {mains > 0 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">סוג העיקריות</p>
              <Segmented
                value={mainsKind}
                onChange={setMainsKind}
                options={[
                  { value: "boneless", label: "ללא עצם" },
                  { value: "mixed", label: "משולב" },
                  { value: "boneIn", label: "עם עצם" },
                ]}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">תיאבון</p>
            <Segmented
              value={appetite}
              onChange={setAppetite}
              options={[
                { value: "light", label: "קליל" },
                { value: "regular", label: "רגיל" },
                { value: "hearty", label: "רעבים" },
              ]}
            />
          </div>
        </section>

        {/* Results */}
        <section className="rounded-3xl bg-cream p-5">
          <p className="text-sm text-muted">מומלץ להזמין עבור {guests} סועדים:</p>
          <div className="divide-y divide-line">
            <ResultRow title="ראשונות וסלטים" line={r.firsts} href={links?.firsts} />
            <ResultRow title="מנות עיקריות" line={r.mains} href={links?.mains} note={mainsKind === "boneIn" ? "כולל עצם" : undefined} />
            <ResultRow title="ירקות ותוספות" line={r.sides} href={links?.sides} />
          </div>
          {r.totalKg > 0 ? (
            <>
              <div className="mt-2 flex items-baseline justify-between border-t-2 border-ink pt-3">
                <span className="font-bold">סה״כ</span>
                <span className="whitespace-nowrap font-display text-3xl font-bold tabular-nums">{kg(r.totalKg)}</span>
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-muted">
                  <span>{r.ediblePerGuest} גרם אוכל לסועד</span>
                  <span>עד {PORTION_RULES.maxTotalPerGuest} גרם</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-leaf-600 transition-all" style={{ width: `${pct}%` }} />
                </div>
                {r.scaledToCap && (
                  <p className="pt-1 text-xs text-brand-700">הקטנו מעט את הסלטים והתוספות כדי לא לעבור את כלל ה-600 גרם.</p>
                )}
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted">בחרו לפחות מנה אחת.</p>
          )}
        </section>
      </div>

      {/* Guidelines */}
      <details className="group border-t border-line px-6 py-4 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
          כללי אצבע של קייטרינג
          <span className="text-muted transition group-open:rotate-180" aria-hidden>⌄</span>
        </summary>
        <ul className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["ראשונות וסלטים", "150–200 גרם לסועד. במגוון סלטים – כ-50 גרם לסועד מכל סלט."],
            ["מנות עיקריות", "150 גרם לסועד לדג, בשר או עוף ללא עצם. 300 גרם לסועד כשיש עצם."],
            ["ירקות ותוספות", "100–150 גרם ירקות או פחמימות לסועד."],
            ["כלל האצבע", "עד כ-600 גרם אוכל לסועד בסך הכל, לא כולל קינוחים."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-2xl bg-cream p-4">
              <p className="font-bold">{t}</p>
              <p className="text-muted">{d}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">מרקים נמכרים במיכלי 400 גרם – מיכל אחד מספיק לכ-2 מנות ראשונות.</p>
      </details>
    </div>
  );
}
