/**
 * Visitor accessibility preferences (the accessibility toolbar). They are
 * per-browser conveniences, so they live in localStorage and are applied as
 * classes / a font size on <html> — before first paint by A11Y_BOOT_SCRIPT,
 * then by the toolbar. CSS for each class is in globals.css.
 */
export const A11Y_STORAGE_KEY = "sk-a11y";
/** Fired on window whenever the preferences change (e.g. the carousel stops autoplay). */
export const A11Y_EVENT = "sk:a11y-change";

/** Root font size steps, in %. Tailwind sizes are rem-based, so the whole site scales. */
export const FONT_STEPS = [100, 112.5, 125, 150] as const;

export const A11Y_TOGGLES = {
  contrast: "a11y-contrast",
  links: "a11y-links",
  readable: "a11y-readable",
  focus: "a11y-focus",
  noMotion: "a11y-no-motion",
} as const;

export type A11yToggle = keyof typeof A11Y_TOGGLES;
export type A11yPrefs = { fontStep: number } & Record<A11yToggle, boolean>;

export const DEFAULT_A11Y: A11yPrefs = {
  fontStep: 0,
  contrast: false,
  links: false,
  readable: false,
  focus: false,
  noMotion: false,
};

export function readA11yPrefs(): A11yPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) ?? "null");
    return saved ? { ...DEFAULT_A11Y, ...saved } : DEFAULT_A11Y;
  } catch {
    return DEFAULT_A11Y;
  }
}

export function saveA11yPrefs(prefs: A11yPrefs) {
  try {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // private mode / storage blocked: the change still applies to this page view
  }
}

export function applyA11yPrefs(prefs: A11yPrefs) {
  const html = document.documentElement;
  const step = FONT_STEPS[prefs.fontStep] ?? 100;
  html.style.fontSize = step === 100 ? "" : `${step}%`;
  for (const [key, cls] of Object.entries(A11Y_TOGGLES)) html.classList.toggle(cls, prefs[key as A11yToggle]);
  window.dispatchEvent(new Event(A11Y_EVENT));
}

/** Inline <head> script: applies saved preferences before first paint (no flash of the default look). */
export const A11Y_BOOT_SCRIPT = `try{var p=JSON.parse(localStorage.getItem(${JSON.stringify(A11Y_STORAGE_KEY)})||"null");if(p){var h=document.documentElement,f=${JSON.stringify(FONT_STEPS)}[p.fontStep|0];if(f&&f!==100)h.style.fontSize=f+"%";var c=${JSON.stringify(A11Y_TOGGLES)};for(var k in c)if(p[k])h.classList.add(c[k]);}}catch(e){}`;
