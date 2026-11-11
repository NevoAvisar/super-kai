/**
 * Super-Kai — Unsplash photo sourcing
 * ===================================
 * Searches the official Unsplash API once per dish (query from
 * src/data/photo-queries.ts), picks the best unused landscape photo and
 * writes it to src/data/product-photos.json with photographer credit.
 * The site hotlinks the photo from the Unsplash CDN, as Unsplash requires.
 *
 *   npm run fetch-photos                  # source every dish that isn't sourced yet
 *   npm run fetch-photos -- --dry-run     # show queries, no API calls
 *   npm run fetch-photos -- --only=shuba-jar,sides-7
 *   npm run fetch-photos -- --force       # re-pick every dish
 *
 * Env: UNSPLASH_ACCESS_KEY (free: https://unsplash.com/oauth/applications)
 *
 * A new Unsplash app is in "demo" mode: 50 requests/hour. 73 dishes therefore
 * take ~1.5 h. The script saves after every dish, and when the hourly quota
 * runs out it waits for the reset and carries on (Ctrl+C is safe, re-run to resume).
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { seedProducts, withSlugs } from "../src/data/catalog-seed";
import { PHOTO_QUERIES } from "../src/data/photo-queries";

const FILE = path.join(process.cwd(), "src", "data", "product-photos.json");
const API = "https://api.unsplash.com";
const UTM = "utm_source=super_kai&utm_medium=referral";

const args = new Set(process.argv.slice(2).map((a) => a.split("=")[0]));
const arg = (k: string) => process.argv.slice(2).find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const DRY = args.has("--dry-run");
const FORCE = args.has("--force");
const ONLY = arg("only")?.split(",").map((s) => s.trim());
const KEY = process.env.UNSPLASH_ACCESS_KEY ?? "";

interface Photo {
  src: string;
  source: "curated" | "unsplash-api";
  unsplashId?: string;
  alt?: string;
  credit?: { name: string; url: string };
  pageUrl?: string;
  query?: string;
}
interface PhotoFile {
  $comment: string;
  photos: Record<string, Photo>;
}

interface SearchResult {
  id: string;
  width: number;
  height: number;
  alt_description: string | null;
  urls: { raw: string };
  links: { html: string };
  user: { name: string; links: { html: string } };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(query: string): Promise<SearchResult[]> {
  for (;;) {
    const url = `${API}/search/photos?${new URLSearchParams({
      query,
      orientation: "landscape",
      content_filter: "high",
      per_page: "15",
    })}`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}`, "Accept-Version": "v1" } });
    const remaining = Number(res.headers.get("x-ratelimit-remaining") ?? "1");

    if (res.status === 401) throw new Error("UNSPLASH_ACCESS_KEY was rejected (401). Check the key in .env.");
    if (res.status === 403 && remaining === 0) {
      await waitForReset();
      continue;
    }
    if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}: ${await res.text()}`);

    const json = (await res.json()) as { results: SearchResult[] };
    if (remaining === 0) await waitForReset(); // quota spent by this call, pause before the next
    return json.results;
  }
}

async function waitForReset() {
  console.log("   ⏳ Hourly Unsplash quota used up, waiting 60 min for it to reset (progress is saved; Ctrl+C is safe)…");
  await sleep(61 * 60_000);
}

async function main() {
  const data = JSON.parse(await fs.readFile(FILE, "utf8")) as PhotoFile;
  let dishes = withSlugs(seedProducts);
  if (ONLY) dishes = dishes.filter((d) => ONLY.includes(d.slug));

  const missingQuery = dishes.filter((d) => !PHOTO_QUERIES[d.slug]);
  if (missingQuery.length) throw new Error(`No query in photo-queries.ts for: ${missingQuery.map((d) => d.slug).join(", ")}`);

  const todo = dishes.filter((d) => FORCE || data.photos[d.slug]?.source !== "unsplash-api");
  console.log(`\n📷 Unsplash sourcing · ${dishes.length} dishes · ${todo.length} to source\n`);

  if (DRY) {
    for (const d of todo) console.log(`○ ${d.slug.padEnd(38)} "${PHOTO_QUERIES[d.slug]}"`);
    return;
  }
  if (!KEY) throw new Error("UNSPLASH_ACCESS_KEY is not set. Add it to .env (see README → Product photos).");

  // Never give two dishes the same photo.
  const used = new Set(
    Object.entries(data.photos)
      .filter(([slug, p]) => p.source === "unsplash-api" && !todo.some((t) => t.slug === slug))
      .map(([, p]) => p.unsplashId),
  );

  let done = 0;
  for (const d of todo) {
    const query = PHOTO_QUERIES[d.slug];
    const results = await search(query);
    const pick = results.find((r) => !used.has(r.id) && r.width >= 1600 && r.width > r.height);
    if (!pick) {
      console.log(`✗ ${d.slug.padEnd(38)} no unused landscape result for "${query}", kept current photo`);
      continue;
    }
    used.add(pick.id);
    data.photos[d.slug] = {
      src: pick.urls.raw,
      source: "unsplash-api",
      unsplashId: pick.id,
      alt: pick.alt_description ?? undefined,
      credit: { name: pick.user.name, url: `${pick.user.links.html}?${UTM}` },
      pageUrl: `${pick.links.html}?${UTM}`,
      query,
    };
    await fs.writeFile(FILE, JSON.stringify(data, null, 2) + "\n"); // save progress every dish
    done++;
    console.log(`✓ ${d.slug.padEnd(38)} ${pick.user.name} · "${pick.alt_description ?? query}"`);
  }
  console.log(`\n✅ ${done} dishes sourced. Restart \`npm run dev\` (or rebuild) to see them.`);
}

main().catch((e) => {
  console.error(`\n❌ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
