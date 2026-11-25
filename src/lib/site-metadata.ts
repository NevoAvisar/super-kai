import type { Metadata } from "next";

/**
 * Shared link-preview metadata (WhatsApp, Facebook, X/Twitter, LinkedIn).
 * The root layout applies it to every page; the home page adds `og:url`.
 * Sub-pages leave `og:url` out on purpose: Facebook/LinkedIn treat it as the
 * canonical link, so a shared /catalog link would otherwise open the home page.
 */
export const SITE_TITLE = "סופר-קאי | מעדניית אוכל מוכן יוקרתי";
export const SITE_DESCRIPTION = "אוכל מוכן ביתי וגורמה באיכות גבוהה של השף קאי. הזמינו עכשיו ממבחר מנות השף.";
export const SHARE_DESCRIPTION = "אוכל מוכן ביתי וגורמה באיכות גבוהה של השף קאי.";

/** public/og-image.jpg — regenerate with `node scripts/og-image/render.cjs`, or replace with a 1200×630 photo. */
export const OG_IMAGE = { url: "/og-image.jpg", width: 1200, height: 630, alt: "Super-Kai Deli", type: "image/jpeg" };

/**
 * Previews need ABSOLUTE image URLs; `metadataBase` turns "/og-image.jpg" into
 * "<site>/og-image.jpg". Set NEXT_PUBLIC_SITE_URL to the real domain; on a
 * Vercel preview deployment VERCEL_URL keeps the preview pointing at itself.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://super-kai.vercel.app");

export const SHARED_OPEN_GRAPH = {
  title: SITE_TITLE,
  description: SHARE_DESCRIPTION,
  siteName: "Super-Kai",
  images: [OG_IMAGE],
  locale: "he_IL",
  type: "website",
} satisfies NonNullable<Metadata["openGraph"]>;

export const SHARED_TWITTER = {
  card: "summary_large_image",
  title: SITE_TITLE,
  description: SHARE_DESCRIPTION,
  images: [{ url: OG_IMAGE.url, alt: OG_IMAGE.alt }],
} satisfies NonNullable<Metadata["twitter"]>;
