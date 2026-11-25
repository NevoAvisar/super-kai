// Renders scripts/og-image/og.html → public/og-image.jpg (1200×630, the link-preview image).
// Usage: node scripts/og-image/render.cjs   (needs Playwright + Chromium; sharp is already a dev dependency)
// Edit og.html (copy, colours, the plated dish SVG) and re-run. Fonts: Heebo & Frank Ruhl Libre (SIL OFL), as on the site.
// To use a real photo instead, just replace public/og-image.jpg with a 1200×630 JPEG (keep it under ~300 KB for WhatsApp).
const path = require("path");
const { chromium } = require("playwright");
const sharp = require("sharp");

(async () => {
  const html = path.join(__dirname, "og.html");
  const out = path.join(__dirname, "..", "..", "public", "og-image.jpg");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto("file://" + html);
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await browser.close();
  const info = await sharp(png)
    .flatten({ background: "#faf6ef" })
    .jpeg({ quality: 88, mozjpeg: true, progressive: true, chromaSubsampling: "4:4:4" })
    .toFile(out);
  console.log(`wrote ${out} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
})();
