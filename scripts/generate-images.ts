/**
 * Super-Kai — AI product photo generator
 * ======================================
 * For every dish, sends its `aiImagePrompt` to the OpenAI Images API, then
 * center-crops the result to 4:3, optimizes it as a progressive JPEG and saves
 * it to public/products/<slug>.jpg. The site picks the file up automatically.
 *
 *   npm run generate-images                    # generate missing / outdated photos
 *   npm run generate-images -- --dry-run       # show the plan, no API calls
 *   npm run generate-images -- --only=shuba-jar,slow-braised-brisket
 *   npm run generate-images -- --limit=3       # try a few first
 *   npm run generate-images -- --force         # regenerate everything
 *
 * Flags:  --dry-run  --force  --only=a,b  --limit=N  --concurrency=N
 *         --quality=low|medium|high|xhigh|max|auto  --source=seed|db
 * Env:    OPENAI_API_KEY (required), OPENAI_IMAGE_MODEL, OPENAI_IMAGE_QUALITY,
 *         OPENAI_IMAGE_SIZE, OPENAI_IMAGE_CONCURRENCY
 *
 * Idempotent and resumable: public/products/manifest.json records the hash of
 * the prompt each photo was generated from. Re-running only regenerates photos
 * whose prompt changed, and never overwrites photos you placed by hand.
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { seedProducts, withSlugs } from "../src/data/catalog-seed";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, "").split("=");
    return [k, v.length ? v.join("=") : "true"] as const;
  }),
);

const CONFIG = {
  apiKey: process.env.OPENAI_API_KEY ?? "",
  model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2.5-sunburst",
  quality: args.get("quality") ?? process.env.OPENAI_IMAGE_QUALITY ?? "high",
  size: process.env.OPENAI_IMAGE_SIZE ?? "1536x1024", // landscape; cropped to 4:3 below
  concurrency: Number(args.get("concurrency") ?? process.env.OPENAI_IMAGE_CONCURRENCY ?? 3),
  dryRun: args.has("dry-run"),
  force: args.has("force"),
  only: args.get("only")?.split(",").map((s) => s.trim()).filter(Boolean),
  limit: args.has("limit") ? Number(args.get("limit")) : undefined,
  source: (args.get("source") ?? "seed") as "seed" | "db",
  // Output: 4:3 to match the ProductCard frame, sharp on retina, ~150–250 KB.
  out: { width: 1600, height: 1200, quality: 82 },
  maxAttempts: 5,
  requestTimeoutMs: 180_000, // complex prompts can take up to ~2 minutes
};

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "products");
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const ENDPOINT = "https://api.openai.com/v1/images/generations";

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------
interface Dish {
  slug: string;
  name: string;
  prompt: string;
}

interface ManifestEntry {
  file: string;
  promptHash: string;
  model: string;
  quality: string;
  bytes: number;
  generatedAt: string;
}
type Manifest = Record<string, ManifestEntry>;

class FatalError extends Error {} // stops the whole run (bad key, no quota)
class SkipError extends Error {} // fails one dish, run continues (moderation)

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hash = (s: string) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
const fileFor = (slug: string) => path.join(OUT_DIR, `${slug}.jpg`);
const exists = (p: string) => fs.access(p).then(() => true, () => false);
const log = (icon: string, slug: string, msg: string) => console.log(`${icon} ${slug.padEnd(38)} ${msg}`);

let stopping = false;
process.on("SIGINT", () => {
  if (stopping) process.exit(130);
  stopping = true;
  console.log("\n⏸  Finishing in-flight images, then stopping (Ctrl+C again to quit now)…");
});

// ---------------------------------------------------------------------------
// Load dishes (seed data, or the live database)
// ---------------------------------------------------------------------------
async function loadDishes(): Promise<Dish[]> {
  if (CONFIG.source === "db") {
    const { PrismaPg } = await import("@prisma/adapter-pg");
    const { PrismaClient } = await import("../src/generated/prisma/client");
    const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
    try {
      const rows = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, name: true, aiImagePrompt: true },
        orderBy: { sortOrder: "asc" },
      });
      return rows.map((r) => ({ slug: r.slug, name: r.name, prompt: r.aiImagePrompt ?? "" }));
    } finally {
      await prisma.$disconnect();
    }
  }
  return withSlugs(seedProducts).map((p) => ({ slug: p.slug, name: p.name, prompt: p.aiImagePrompt ?? "" }));
}

async function readManifest(): Promise<Manifest> {
  try {
    return JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    return {};
  }
}

// Serialize manifest writes so concurrent workers never clobber each other.
let manifestWrite = Promise.resolve();
function saveManifest(m: Manifest) {
  manifestWrite = manifestWrite.then(async () => {
    const sorted = Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));
    const tmp = `${MANIFEST}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(sorted, null, 2) + "\n");
    await fs.rename(tmp, MANIFEST);
  });
  return manifestWrite;
}

type Plan = { dish: Dish; reason: "missing" | "prompt changed" | "forced" } | { dish: Dish; skip: string };

async function plan(dish: Dish, manifest: Manifest): Promise<Plan> {
  if (!dish.prompt) return { dish, skip: "no aiImagePrompt" };
  const onDisk = await exists(fileFor(dish.slug));
  const entry = manifest[dish.slug];
  if (CONFIG.force) return { dish, reason: "forced" };
  if (!onDisk) return { dish, reason: "missing" };
  if (!entry) return { dish, skip: "hand-placed photo (not in manifest), kept" };
  if (entry.promptHash !== hash(dish.prompt)) return { dish, reason: "prompt changed" };
  return { dish, skip: "up to date" };
}

// ---------------------------------------------------------------------------
// OpenAI call with retries
// ---------------------------------------------------------------------------
async function generate(prompt: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${CONFIG.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: CONFIG.model,
          prompt,
          n: 1,
          size: CONFIG.size,
          quality: CONFIG.quality,
          output_format: "jpeg",
          output_compression: 95, // we re-encode below, keep the source crisp
        }),
        signal: AbortSignal.timeout(CONFIG.requestTimeoutMs),
      });
    } catch (e) {
      if (attempt >= CONFIG.maxAttempts) throw e;
      await backoff(attempt, null, `network error: ${(e as Error).message}`);
      continue;
    }

    if (res.ok) {
      const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
      const item = json.data?.[0];
      if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
      if (item?.url) return Buffer.from(await (await fetch(item.url)).arrayBuffer()); // older models
      throw new Error("API returned no image data");
    }

    const body = (await res.json().catch(() => ({}))) as { error?: { code?: string; message?: string } };
    const code = body.error?.code ?? "";
    const message = body.error?.message ?? res.statusText;

    if (res.status === 401 || res.status === 403) throw new FatalError(`Authentication failed (${res.status}): ${message}`);
    if (code === "insufficient_quota" || code === "billing_hard_limit_reached") throw new FatalError(`Out of credit: ${message}`);
    if (code === "model_not_found") throw new FatalError(`Model "${CONFIG.model}" not available: ${message}. Set OPENAI_IMAGE_MODEL.`);
    if (code === "moderation_blocked") throw new SkipError(`blocked by moderation: ${message}`);

    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= CONFIG.maxAttempts) throw new Error(`HTTP ${res.status}: ${message}`);
    await backoff(attempt, res.headers.get("retry-after"), `HTTP ${res.status}`);
  }
}

async function backoff(attempt: number, retryAfter: string | null, why: string) {
  const ms = retryAfter ? Number(retryAfter) * 1000 : Math.min(60_000, 2000 * 2 ** (attempt - 1)) + Math.random() * 1000;
  console.log(`   ↻ ${why}, retrying in ${(ms / 1000).toFixed(1)}s (attempt ${attempt + 1}/${CONFIG.maxAttempts})`);
  await sleep(ms);
}

// ---------------------------------------------------------------------------
// Optimize & save (atomic write)
// ---------------------------------------------------------------------------
async function optimizeAndSave(slug: string, raw: Buffer): Promise<number> {
  const jpeg = await sharp(raw)
    .rotate()
    .resize(CONFIG.out.width, CONFIG.out.height, { fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: CONFIG.out.quality, mozjpeg: true, progressive: true })
    .toBuffer();
  const meta = await sharp(jpeg).metadata();
  if (meta.width !== CONFIG.out.width || meta.height !== CONFIG.out.height) throw new Error("optimized image has wrong dimensions");

  const target = fileFor(slug);
  const tmp = `${target}.tmp`;
  await fs.writeFile(tmp, jpeg);
  await fs.rename(tmp, target);
  return jpeg.length;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const manifest = await readManifest();

  let dishes = await loadDishes();
  if (CONFIG.only) {
    const unknown = CONFIG.only.filter((s) => !dishes.some((d) => d.slug === s));
    if (unknown.length) throw new FatalError(`Unknown slug(s): ${unknown.join(", ")}`);
    dishes = dishes.filter((d) => CONFIG.only!.includes(d.slug));
  }

  const plans = await Promise.all(dishes.map((d) => plan(d, manifest)));
  let todo = plans.filter((p): p is Extract<Plan, { reason: string }> => "reason" in p);
  const skipped = plans.filter((p): p is Extract<Plan, { skip: string }> => "skip" in p);
  if (CONFIG.limit !== undefined) todo = todo.slice(0, CONFIG.limit);

  console.log(`\n🍽  Super-Kai image generator`);
  console.log(`   model=${CONFIG.model} quality=${CONFIG.quality} size=${CONFIG.size} → ${CONFIG.out.width}x${CONFIG.out.height} JPEG`);
  console.log(`   ${dishes.length} dishes · ${todo.length} to generate · ${skipped.length} skipped · concurrency ${CONFIG.concurrency}\n`);
  for (const s of skipped) if (s.skip !== "up to date") log("·", s.dish.slug, s.skip);

  if (CONFIG.dryRun) {
    for (const t of todo) log("○", t.dish.slug, `would generate (${t.reason})`);
    console.log(`\nDry run, no API calls made. Billing is per output token; check pricing for ${CONFIG.model} × ${todo.length} images.`);
    return;
  }
  if (!todo.length) return console.log("✅ Everything is up to date.");
  if (!CONFIG.apiKey) throw new FatalError("OPENAI_API_KEY is not set. Add it to .env (see README → Product photos).");

  const failures: { slug: string; error: string }[] = [];
  let done = 0;
  let fatal: Error | null = null;
  const queue = [...todo];
  const started = Date.now();

  async function worker() {
    while (queue.length && !fatal && !stopping) {
      const { dish, reason } = queue.shift()!;
      const t0 = Date.now();
      try {
        const raw = await generate(dish.prompt);
        const bytes = await optimizeAndSave(dish.slug, raw);
        manifest[dish.slug] = {
          file: `/products/${dish.slug}.jpg`,
          promptHash: hash(dish.prompt),
          model: CONFIG.model,
          quality: CONFIG.quality,
          bytes,
          generatedAt: new Date().toISOString(),
        };
        await saveManifest(manifest);
        done++;
        log("✓", dish.slug, `${(bytes / 1024).toFixed(0)} KB · ${((Date.now() - t0) / 1000).toFixed(1)}s · ${reason} [${done}/${todo.length}]`);
      } catch (e) {
        if (e instanceof FatalError) fatal = e;
        failures.push({ slug: dish.slug, error: (e as Error).message });
        log("✗", dish.slug, (e as Error).message);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, CONFIG.concurrency) }, worker));
  await manifestWrite;

  const secs = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`\n${failures.length ? "⚠️" : "✅"}  ${done} generated, ${failures.length} failed, ${queue.length} not started · ${secs}s`);
  if (failures.length) {
    console.log(`   Retry the failures with:\n   npm run generate-images -- --only=${failures.map((f) => f.slug).join(",")}`);
  }
  if (fatal) throw fatal;
  if (failures.length || stopping) process.exitCode = 1;
}

main().catch((e) => {
  console.error(`\n❌ ${e instanceof Error ? e.message : e}`);
  process.exit(1);
});
