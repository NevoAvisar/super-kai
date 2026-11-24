"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Cookie } from "lucide-react";
import { OPEN_CONSENT_EVENT, readConsent, saveConsent, type ConsentCategory } from "@/lib/cookie-consent";

const CATEGORIES: { key: "necessary" | ConsentCategory; title: string; text: string }[] = [
  {
    key: "necessary",
    title: "הכרחיות",
    text: "סל הקניות, התחברות לחשבון והגדרות הנגישות. בלעדיהן האתר לא עובד, ולכן הן תמיד פעילות.",
  },
  { key: "analytics", title: "סטטיסטיקה", text: "עוזרות לנו להבין אילו מנות ודפים מעניינים אתכם, כדי לשפר את האתר." },
  { key: "marketing", title: "שיווק", text: "מאפשרות להציג לכם מבצעים והמלצות מותאמים גם מחוץ לאתר." },
];

/**
 * Cookie consent banner, pinned to the bottom of the screen until the visitor
 * decides. "אישור הכל" accepts every category, "הגדרות" opens per-category
 * switches (necessary is locked on), "רק הכרחיות" declines the optional ones.
 * The footer's "הגדרות עוגיות" link reopens the settings at any time.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(false);
  const [choice, setChoice] = useState<Record<ConsentCategory, boolean>>({ analytics: false, marketing: false });
  const titleId = useId();
  const firstSwitchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
    const reopen = () => {
      const saved = readConsent();
      if (saved) setChoice({ analytics: saved.analytics, marketing: saved.marketing });
      setVisible(true);
      setSettings(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (settings) firstSwitchRef.current?.focus();
  }, [settings]);

  if (!visible) return null;

  const decide = (c: Record<ConsentCategory, boolean>) => {
    saveConsent(c);
    setVisible(false);
    setSettings(false);
  };

  const primary =
    "h-11 rounded-xl bg-ink px-5 text-sm font-bold text-paper transition hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";
  const secondary =
    "h-11 rounded-xl px-5 text-sm font-bold ring-1 ring-line transition hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";

  return (
    <section
      role="region"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4 print:hidden"
    >
      <div className="mx-auto max-h-[calc(100dvh-1.5rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-3xl bg-paper p-5 text-ink shadow-[0_-8px_40px_rgba(43,38,34,0.18)] ring-1 ring-line sm:p-6">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-lg font-bold">
              {settings ? "הגדרות עוגיות" : "האתר שלנו משתמש בעוגיות"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              אנחנו משתמשים בעוגיות ובאחסון מקומי כדי שהאתר יעבוד, ובהסכמתכם גם לסטטיסטיקה ולשיווק. אפשר לשנות את הבחירה בכל
              עת דרך &quot;הגדרות עוגיות&quot; בתחתית העמוד.{" "}
              <Link href="/privacy" className="font-medium text-brand-600 underline underline-offset-2">
                למדיניות הפרטיות
              </Link>
            </p>
          </div>
        </div>

        {settings && (
          <ul className="mt-4 divide-y divide-line rounded-2xl bg-cream px-4">
            {CATEGORIES.map((c, i) => {
              const locked = c.key === "necessary";
              const checked = locked || choice[c.key as ConsentCategory];
              const id = `${titleId}-${c.key}`;
              return (
                <li key={c.key} className="flex items-start gap-4 py-3">
                  <div className="flex-1">
                    <label htmlFor={id} className="text-sm font-bold">
                      {c.title}
                      {locked && <span className="ms-2 text-xs font-medium text-muted">(תמיד פעילות)</span>}
                    </label>
                    <p className="text-xs text-muted" id={`${id}-desc`}>
                      {c.text}
                    </p>
                  </div>
                  <input
                    ref={i === 1 ? firstSwitchRef : undefined}
                    id={id}
                    type="checkbox"
                    role="switch"
                    aria-describedby={`${id}-desc`}
                    checked={checked}
                    disabled={locked}
                    onChange={(e) => setChoice((s) => ({ ...s, [c.key]: e.target.checked }))}
                    className="mt-1 size-5 shrink-0 accent-brand-600 disabled:opacity-60"
                  />
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {settings ? (
            <>
              <button type="button" className={secondary} onClick={() => decide({ analytics: false, marketing: false })}>
                רק הכרחיות
              </button>
              <button type="button" className={secondary} onClick={() => decide(choice)}>
                שמירת הבחירה
              </button>
            </>
          ) : (
            <button type="button" className={secondary} onClick={() => setSettings(true)}>
              הגדרות
            </button>
          )}
          <button type="button" className={primary} onClick={() => decide({ analytics: true, marketing: true })}>
            אישור הכל
          </button>
        </div>
      </div>
    </section>
  );
}
