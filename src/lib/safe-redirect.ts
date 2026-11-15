/**
 * Post-login return path ("/login?next=/checkout").
 *
 * EN: only same-site absolute paths are accepted. "//evil.com", "/\\evil.com",
 *     "https://…" and "javascript:…" all fall back, so the login page can't be
 *     turned into an open redirect.
 * HE: מתקבלים רק נתיבים פנימיים באתר. כל דבר אחר (דומיין חיצוני, javascript:)
 *     חוזר לברירת המחדל – כך דף ההתחברות לא הופך ל-open redirect.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  let path: string;
  try {
    path = decodeURIComponent(raw).trim();
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(path)) return fallback;
  // Never bounce back to the login page itself (would loop).
  if (path === "/login" || path.startsWith("/login?") || path.startsWith("/login/")) return fallback;
  return path;
}

/** "/login?next=<current path>" for a gate that sends a guest to sign in. */
export function loginHref(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}
