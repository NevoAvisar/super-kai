# סופר-קאי · Super-Kai

Ready-made food e-commerce site + admin dashboard for Kai, a home-style food producer.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Prisma 7 + PostgreSQL · Zustand · Vitest

## Quick start

```bash
npm install
npx prisma generate
npm run dev        # http://localhost:3000. Catalog served from mock data, no DB needed
npm test           # business-logic unit tests
```

### With a real database
```bash
# .env → set DATABASE_URL and CATALOG_SOURCE="db"
npm run db:migrate -- --name init
npm run db:seed    # 8 categories, 75 products, admin user, store settings
```

## Product photos (Unsplash)

Every dish shows a real food photo from Unsplash, hotlinked from Unsplash's CDN and cropped to the card's 4:3 frame. Assignments live in `src/data/product-photos.json`, and a test ensures no dish is ever left without one.

- **Right now** the file holds an interim, hand-checked set of 55 Unsplash photos, each the closest available match (some are reused).
- **For a precise photo per dish** with photographer credit, get a free Access Key at https://unsplash.com/oauth/applications, put it in `.env` as `UNSPLASH_ACCESS_KEY`, then run:
  ```bash
  npm run fetch-photos -- --dry-run   # shows the search query for each dish
  npm run fetch-photos                # ~1.5 h in Unsplash demo mode (50 req/h); waits and resumes by itself
  ```
  Queries live in `src/data/photo-queries.ts`. Retry one dish with `--only=<slug>`.

A local file at `public/products/<slug>.jpg` always overrides the Unsplash photo (see below).

## Product photos (AI-generated, optional)

Every dish has an `aiImagePrompt`. One command turns them all into real photos:

1. Add your OpenAI key to `.env` (get one at https://platform.openai.com/api-keys):
   ```bash
   OPENAI_API_KEY="sk-..."
   ```
2. Preview what will happen (no API calls, no cost):
   ```bash
   npm run generate-images -- --dry-run
   ```
3. Try 3 dishes first and look at them in the browser:
   ```bash
   npm run generate-images -- --limit=3
   ```
4. Generate the rest:
   ```bash
   npm run generate-images
   ```

Each image is center-cropped to 4:3, optimized to a ~1600×1200 progressive JPEG and saved as `public/products/<slug>.jpg`. In `npm run dev` it shows up on the next page load. For production, generate **before** `npm run build` and commit `public/products/` so the photos deploy with the site.

| Flag | What it does |
|---|---|
| `--dry-run` | List what would be generated, no API calls |
| `--limit=N` | Generate at most N images |
| `--only=slug1,slug2` | Specific dishes (e.g. retry failures, the script prints this line for you) |
| `--force` | Regenerate everything, even up-to-date photos |
| `--quality=medium` | Cheaper/faster drafts (`low` · `medium` · `high` · `xhigh` · `max`) |
| `--concurrency=N` | Parallel requests (default 3) |
| `--source=db` | Read dishes from PostgreSQL instead of the seed data |

**Safe to re-run.** `public/products/manifest.json` stores a hash of the prompt behind each photo. Re-running only creates missing photos and regenerates ones whose prompt you edited. A photo you put in the folder yourself (not in the manifest) is never overwritten. Rate limits and server errors are retried with backoff. A bad key or empty balance stops the run. A moderation refusal skips that dish. Ctrl+C finishes the images in flight and stops cleanly.

Env overrides: `OPENAI_IMAGE_MODEL` (default `gpt-image-2.5-sunburst`; DALL·E 3 was removed from the API in May 2026), `OPENAI_IMAGE_QUALITY`, `OPENAI_IMAGE_SIZE`, `OPENAI_IMAGE_CONCURRENCY`. Billing is per output token, so check OpenAI's pricing page for the current cost per image.

## Architecture

```
prisma/
  schema.prisma          Data model (users, auth, catalog, promotions, cart, orders, notifications, settings)
  seed.ts                Seeds DB from src/data/catalog-seed.ts
src/data/
  gourmet-sample.json    15 signature dishes: Hebrew/English, ingredients, serving guide, AI image prompt
  catalog-seed.ts        7 deli categories + the rest of the menu (73 products total)
  photo-style.ts         Shared photo style + shot() wrapper for every aiImagePrompt
docs/signature-menu.md   Generated: 15 signature dishes, menu breakdown + prompts
docs/image-prompts.md    Generated: aiImagePrompt for all 73 dishes (+ image-prompts.json for batch use)
scripts/export-menu.ts   Generator for the docs above
scripts/generate-images.ts  AI photo generator (npm run generate-images)
scripts/fetch-photos.ts     Unsplash photo sourcing (npm run fetch-photos)
src/data/product-photos.json  Photo per dish (Unsplash), read by lib/product-images.ts
src/
  lib/                   ← pure, framework-free business logic (unit-tested)
    config.ts            StoreRules: 150 ₪ threshold, fee, 14:30 cut-off, closed days, TZ
    pricing.ts           Delivery fee, line/cart totals, promotions
    delivery-date.ts     Next-day / 14:30 cut-off date calculation (Asia/Jerusalem)
    quantity.ts          0.25 kg step math (integer steps, no float drift)
    portion-guide.ts     "How much to order?" catering calculator + "serves ~N" estimate
    dietary.ts           Dietary badge labels/styles
    money.ts             Agorot ↔ ₪ formatting
    catalog.ts           Catalog read-model (mock or Prisma via CATALOG_SOURCE)
    db.ts                Prisma client singleton (pg driver adapter)
  store/cart.ts          Guest-friendly client cart (localStorage)
  components/            ProductCard, ProductImage, ProductGrid, QuantityStepper, DietaryBadge,
                         PortionGuide (modal), CatalogBrowser (search + dietary filters), Header…
  app/
    page.tsx             Homepage: hero, About Us, What We Sell / How it works, featured
    catalog/             All products + /catalog/[slug] per category (public, no login)
    cart/                Cart with delivery/pickup toggle and live totals
    checkout/            Checkout form; server action re-validates price, 0.25 kg steps, fee and 14:30 date
```

### Key design decisions
- **Money = integer agorot**, quantities = `Decimal(7,2)` in DB and integer steps in code.
- **Orders snapshot** prices, names, address and fees, so editing a product never rewrites history or invoices.
- **Business rules are data**: the `StoreSettings` row lets Kai change fee, threshold, cut-off and closed days from the admin dashboard; the pure functions take `rules` as a parameter.
- **Delivery date is computed, not chosen.** The server re-validates it at checkout (`isValidDeliveryDate`) so a tab left open past 14:30 can't place an order for a date that's no longer valid.
- **Guest cart**: browsing and adding to cart need no account. On login, the guest cart (`Cart.guestToken`) merges into the user's cart.

## Admin screens without a database (local mock)
`/admin` works today with **no backend**, so the whole site can be tried end to end. Sign in with the mock admin account defined in `src/context/AuthContext.tsx`.

| Screen | What it does |
| --- | --- |
| `/admin` | **Overview**: revenue and delivery KPIs with a daily / weekly / monthly toggle and a trend vs the previous period, live order status (pending approval, open, delivered), revenue and delivery trend charts, revenue share per customer, active orders per delivery zone. |
| `/admin/orders` | **Orders & kitchen prep**, filtered by today / tomorrow / all, in three views: kitchen totals per dish with a "prepared" checklist, active orders grouped by delivery zone with a delivery count, and full order cards with one-click status steps (approve → to kitchen → delivered). |
| `/admin/customers` | Directory with tier badges (VIP / regular / new), total paid, order count, last order; sort and filter; a drawer with order history and favourite dishes; add a customer. |
| `/admin/products` | Edit name, price, stock status and the "shown on site" flag; add a product. Best and lowest sellers on top, quantity sold and revenue per row, sort by sales. |
| `/admin/promotions` | Create, edit and disable a discount on one product or a whole category, with a start and optional end date (`Promotion` model: `PERCENT_OFF` / `AMOUNT_OFF` / `FIXED_PRICE`). |
| `/orders` | The signed-in customer's own orders (matched by account email or the checkout email). |

**Dashboard numbers** come from pure functions in `src/lib/admin-analytics.ts` (tested): revenue and counts are attributed to the delivery date and never include cancelled orders; delivery zones are a city → zone table in the same file; VIP = 2,000 ₪ paid or 8+ orders, regular = 2+ orders. Charts are plain HTML/SVG (`src/components/admin/charts.tsx`), no chart library.

**Sample orders.** The first time the dashboard opens with fewer than 5 orders, `src/lib/demo-orders.ts` adds about 12 weeks of invented orders (flagged `isDemo`, numbered below 1001) so every chart has data. They mix with real orders placed on the site; the overview has a link to remove them, and another to load them again.

**Order flow in the mock.** There is no payment step, so a new order starts as "ממתינה לאישור" (the schema's `PENDING_PAYMENT`) until the admin approves it.

**How the layering works** (`src/lib/local-admin.ts`, `src/store/admin.ts`, `src/lib/use-live-catalog.ts`):
- The server still renders the seed catalog. Admin edits are stored in `localStorage` as *overrides* per product id (only the changed fields), *added* products, and *promotions*.
- Promotions that ship with the seed (`promoPercent`) show up as built-in promotions (`seed-<productId>`); saving one stores a replacement with the same id, which is how it is edited or disabled.
- `applyLocalAdmin()` merges all of that over the base catalog and re-prices with `lib/pricing.ts` (best live promotion wins). Client components get the merged list from `useLiveCatalog()` after hydration; hidden products drop out of the public pages.
- Checkout sends the same local data to the `prepareOrder` server action, so the order is priced from the catalog the customer saw, and the confirmed order is saved to `localStorage`.

**This is demo data, not a backend.** It lives in one browser, is not secure (anyone can edit `localStorage` or call the checkout action with made-up prices, and the admin gate is client-side only), and other devices never see it. When the database is connected:
1. Replace the mock auth with real sessions and check the admin role **on the server** for every admin action.
2. Turn the store actions into server actions that write `Product`, `Promotion` and `Order` rows; delete `lib/local-admin.ts`' overlay, `useLiveCatalog()` and the `local` argument of `prepareOrder`.
3. Have checkout create the `Order` on the server (order number, payment, invoice) and read `/orders` and `/admin/orders` from the DB.
4. Known gaps of the mock: a cart line keeps the price it was added at until checkout re-prices it; the home-page hero line-up is picked on the server, so it shows edited names and prices but does not drop a hidden or out-of-stock dish.

## Menu & portions
- **Categories:** ראשונות וסלטים · מנות עיקריות · ירקות ותוספות · מרקים (400 g containers) · טארטים, פיצות ומאפים · ממרחים ורטבים · ארוחות שלמות.
- **Selling units:** `KG` products use 0.25 kg steps. `UNIT` products (soups, jars, quiches, meals) carry `unitWeightGrams` + `unitLabel`, so every card can show a **price per 100 g**.
- **Portion guide:** firsts 150–200 g/guest (~50 g per salad), mains 150 g boneless / 300 g bone-in, sides 100–150 g, ≤ ~600 g edible per guest. Results round up to 0.25 kg so they map straight onto the stepper.
- **Photos:** every product has an `aiImagePrompt` (enforced by a test). Generate each dish with its prompt from `docs/image-prompts.md` and save it as `public/products/<slug>.jpg` (.webp/.png also work). It is picked up automatically. Until then cards show a styled "plate" placeholder.

## Open decisions (need Kai's input)
1. ~~Minimum order vs. delivery fee~~ **Decided (2026-11-11):** 150 ₪ is the **free-delivery threshold**. Delivery orders below it pay a fee, and there is no hard minimum (`minimumOrderAgorot` stays 0).
2. **Delivery fee amount**: placeholder 25 ₪.
3. **Closed days**: Saturday by default (a Friday/Saturday order rolls to Sunday).
4. **Cut-off at exactly 14:30** counts as "after" (orders until 14:29 ship tomorrow).

## Roadmap
- **Step 2**: Auth.js (email/password + Google/Apple), `/checkout` gate with cart persistence, pickup/delivery form, payment (Cardcom/Tranzila/Stripe), invoice generation.
- **Step 3**: Admin dashboard on the database: product/category/promotion CRUD, order calendar (week/month/year), stats. (A local, no-database version of products, promotions and orders already exists; see above.)
- **Step 4**: Notifications: new-order Email + WhatsApp, daily summary cron (`NotificationLog`).
