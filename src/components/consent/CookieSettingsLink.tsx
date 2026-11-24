"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/cookie-consent";

/** Reopens the cookie settings, so visitors can change their choice at any time. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={className}>
      הגדרות עוגיות
    </button>
  );
}
