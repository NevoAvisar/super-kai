"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import { AArrowDown, AArrowUp, Accessibility, Contrast, Keyboard, Link as LinkIcon, Pause, RotateCcw, Type, X } from "lucide-react";
import {
  applyA11yPrefs,
  DEFAULT_A11Y,
  FONT_STEPS,
  readA11yPrefs,
  saveA11yPrefs,
  type A11yPrefs,
  type A11yToggle,
} from "@/lib/a11y-prefs";

const TOGGLES: { key: A11yToggle; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "contrast", label: "ניגודיות גבוהה", icon: Contrast },
  { key: "links", label: "הדגשת קישורים", icon: LinkIcon },
  { key: "readable", label: "גופן קריא", icon: Type },
  { key: "focus", label: "הדגשת ניווט מקלדת", icon: Keyboard },
  { key: "noMotion", label: "עצירת אנימציות", icon: Pause },
];

/**
 * Accessibility toolbar (IS 5568 / WCAG 2.1 AA): text size, high contrast,
 * link highlighting, a readable font, a strong keyboard-focus outline and
 * stopping motion. A tab on the screen edge opens a non-modal panel; Esc
 * closes it and returns focus to the tab. Alt+A toggles it from anywhere.
 */
export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_A11Y);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // The saved preferences were already applied before paint (A11Y_BOOT_SCRIPT); sync the controls.
  useEffect(() => setPrefs(readA11yPrefs()), []);

  const update = (next: A11yPrefs) => {
    setPrefs(next);
    applyA11yPrefs(next);
    saveA11yPrefs(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "KeyA") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("button")?.focus();
  }, [open]);

  const changed = JSON.stringify(prefs) !== JSON.stringify(DEFAULT_A11Y);
  const tile =
    "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-start text-sm font-medium ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

  return (
    <div className="fixed top-1/2 end-0 z-50 -translate-y-1/2 print:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="a11y-panel"
        aria-label="תפריט נגישות (Alt+A)"
        title="תפריט נגישות"
        className="grid size-12 place-items-center rounded-s-2xl bg-[#1f4e9c] text-white shadow-lg transition hover:bg-[#173d7a] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#1f4e9c]"
      >
        <Accessibility className="size-7" aria-hidden />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="a11y-panel"
          role="dialog"
          aria-labelledby={titleId}
          className="absolute end-14 top-1/2 w-[min(20rem,calc(100vw-5rem))] -translate-y-1/2 rounded-3xl bg-paper p-5 text-ink shadow-2xl ring-1 ring-line"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id={titleId} className="font-display text-xl font-bold">
              כלי נגישות
            </h2>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              aria-label="סגירת תפריט הנגישות"
              className="grid size-9 place-items-center rounded-full hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div role="group" aria-label="גודל טקסט" className="mb-3 flex items-center gap-2 rounded-xl bg-cream p-2">
            <button
              type="button"
              onClick={() => update({ ...prefs, fontStep: Math.max(0, prefs.fontStep - 1) })}
              disabled={prefs.fontStep === 0}
              aria-label="הקטנת טקסט"
              className="grid size-10 place-items-center rounded-lg bg-paper ring-1 ring-line disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <AArrowDown className="size-5" aria-hidden />
            </button>
            <p className="flex-1 text-center text-sm font-medium" aria-live="polite">
              גודל טקסט: {FONT_STEPS[prefs.fontStep]}%
            </p>
            <button
              type="button"
              onClick={() => update({ ...prefs, fontStep: Math.min(FONT_STEPS.length - 1, prefs.fontStep + 1) })}
              disabled={prefs.fontStep === FONT_STEPS.length - 1}
              aria-label="הגדלת טקסט"
              className="grid size-10 place-items-center rounded-lg bg-paper ring-1 ring-line disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-brand-500"
            >
              <AArrowUp className="size-5" aria-hidden />
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {TOGGLES.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={prefs[key]}
                  onClick={() => update({ ...prefs, [key]: !prefs[key] })}
                  className={`${tile} w-full ${prefs[key] ? "bg-ink text-paper ring-ink" : "bg-paper ring-line hover:bg-brand-50"}`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => update(DEFAULT_A11Y)}
                disabled={!changed}
                className={`${tile} w-full bg-paper ring-line hover:bg-brand-50 disabled:opacity-40`}
              >
                <RotateCcw className="size-4 shrink-0" aria-hidden />
                איפוס
              </button>
            </li>
          </ul>

          <Link
            href="/accessibility"
            onClick={() => setOpen(false)}
            className="mt-4 block text-center text-sm font-bold text-brand-600 underline-offset-4 hover:underline"
          >
            הצהרת נגישות
          </Link>
        </div>
      )}
    </div>
  );
}
