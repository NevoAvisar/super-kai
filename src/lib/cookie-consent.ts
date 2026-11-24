/**
 * Cookie consent (Israeli Privacy Protection Law, Amendment 13 / GDPR-style
 * opt-in). Strictly necessary storage (cart, sign-in, accessibility settings)
 * is always on; analytics and marketing need an explicit opt-in. Any future
 * tracking script must check `hasConsent("analytics" | "marketing")` first.
 */
export const CONSENT_STORAGE_KEY = "sk-cookie-consent";
/** Bump when the categories change, so visitors are asked again. */
export const CONSENT_VERSION = 1;
/** Fired on window to reopen the settings (footer link). */
export const OPEN_CONSENT_EVENT = "sk:cookie-settings";
/** Fired on window after the visitor saves a choice. */
export const CONSENT_CHANGED_EVENT = "sk:cookie-consent";

export type ConsentCategory = "analytics" | "marketing";

export interface ConsentState {
  version: number;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of the decision (kept as a record of consent). */
  decidedAt: string;
}

export function readConsent(): ConsentState | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY) ?? "null") as ConsentState | null;
    return saved?.version === CONSENT_VERSION ? saved : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Record<ConsentCategory, boolean>): ConsentState {
  const state: ConsentState = { version: CONSENT_VERSION, necessary: true, ...choice, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage blocked: the choice holds for this page view only
  }
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT));
  return state;
}

export const hasConsent = (category: ConsentCategory) => !!readConsent()?.[category];
