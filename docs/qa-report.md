# דו״ח QA · סופר-קאי — QA Report · Super-Kai

**תאריך / Date:** 2026-11-15 · **ענף / Branch:** `claude/super-kai-qa-audit-50vb64`
**היקף / Scope:** צד לקוח, צד שרת, דשבורד אדמין, מובייל · Client, server, admin dashboard, mobile

---

## 0. תקציר מנהלים · Executive summary

**עברית.** הבסיס של המערכת טוב: כל לוגיקת הכסף, הכמויות ותאריכי האספקה נמצאת בפונקציות טהורות ומכוסה בבדיקות. הסכומים נשמרים באגורות שלמות והכמויות מחושבות בצעדים שלמים, כך שאין סטיות של נקודה צפה. מצאנו ותיקנו **14 תקלות**. החמורות שבהן: לקופה לא היה שער התחברות כלל, וההתחברות לא החזירה את הלקוח לעמוד שממנו הגיע. במובייל, עמוד הסל נגלל לרוחב (507px בטלפון של 360px), כל האתר נגלל לרוחב ב-320px, ולא היה תפריט ניווט. פעולת השרת של הקופה קרסה על קלט שבור. לא היה דף 404 בעברית. אחרי התיקונים יש 237 בדיקות יחידה ו-12 בדיקות קצה-לקצה בדפדפן, וכולן עוברות.

**English.** The foundations are solid. Money, quantities and delivery dates live in pure, unit-tested functions. Money is stored as integer agorot and quantities are counted in integer steps, so there is no floating-point drift. We found and fixed **14 defects**. The most serious: checkout had no auth gate, and login never returned the customer to where they came from. On mobile, the cart scrolled sideways (507px of content on a 360px phone), every page overflowed at 320px, and there was no navigation menu. The checkout server action crashed on malformed input, and there was no Hebrew 404 page. After the fixes, 237 unit tests and 12 end-to-end browser checks all pass.

| בדיקה · Check | לפני · Before | אחרי · After |
|---|---|---|
| `tsc --noEmit` | ✅ | ✅ |
| `vitest` | 219 ✅ | **237 ✅** (+18) |
| `next build` | ✅ | ✅ |
| E2E (Playwright, 390px mobile) | — | **12/12 ✅** |
| Horizontal scroll @320/360/390px | ❌ 13/13 pages @320 · ❌ cart @360/390 | **✅ 0 pages** |

---

## 1. תקלות שנמצאו ותוקנו · Defects found & fixed

חומרה · Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

| # | חומרה | תקלה (HE) | Defect (EN) | תיקון · Fix (files) |
|---|---|---|---|---|
| 1 | 🔴 | לקופה לא היה שער התחברות. כל אורח יכל לבצע הזמנה, למרות הדרישה ש"המשך לקופה" יבקש התחברות. | `/checkout` had no auth gate. Guests could place orders, contrary to the spec. | `checkout/page.tsx` is wrapped in `AccountGate` with checkout-specific copy. In the cart, "המשך לקופה" sends a guest to `/login?next=/checkout`. |
| 2 | 🔴 | אחרי התחברות הלקוח הגיע תמיד לדף הבית. ההודעה "נחזיר אתכם לכאן" לא התקיימה. | After login, users always landed on `/` despite the "we'll bring you back" copy. | New `lib/safe-redirect.ts` with `safeNextPath()` (blocks open redirects such as `//evil.com`, `javascript:` and control characters). `AuthForm` honours `?next=`, and `AccountGate` sends it. |
| 3 | 🔴 | **מובייל:** עמוד הסל נגלל לרוחב, 507px של תוכן במסך של 360px. | **Mobile:** the cart page scrolled sideways (507px content on a 360px viewport). | The grid track was implicit `auto`, so truncated names set its minimum width. Fixed with `grid-cols-[minmax(0,1fr)]` in the cart and checkout. |
| 4 | 🟠 | **מובייל:** ב-320px כל עמוד באתר נגלל לרוחב, כי שורת הכותרת הייתה ברוחב 352px. | **Mobile:** at 320px every page scrolled sideways (header row was 352px). | `Header.tsx`: logo `text-2xl sm:text-3xl`, smaller gaps, compact cart button. |
| 5 | 🟠 | **מובייל:** תפריט הניווט היה `hidden md:flex` בלי חלופה, כך שבטלפון לא היה ניווט כלל. | **Mobile:** main nav was `hidden md:flex` with no replacement, so phones had no navigation at all. | A scrollable nav row now shows below `md`. |
| 6 | 🟠 | פעולת השרת `prepareOrder` קרסה (500) על קלט לא תקין, כמו `contact: null` או `items` שאינו מערך. | `prepareOrder` server action crashed (500) on malformed input (`contact: null`, non-array `items`). | `normalizeCheckoutInput()` checks the runtime shape, truncates strings to 300 characters, and validates the admin overlay. |
| 7 | 🟠 | לא הייתה תקרת כמות לשורה (אפשר היה להזמין 10,000 ק״ג), ולא נבדק מוצר כפול. | No per-line quantity cap (10,000 kg was accepted) and no duplicate-line check. | `MAX_LINE_QUANTITY` is 30 kg / 50 units, `MAX_CART_LINES` is 100. The stepper stops at the cap (and its "+" is disabled there), and the server rejects anything above it or any duplicate line. |
| 8 | 🟡 | אחרי דחייה של "תאריך ישן", לקוח ששעון המכשיר שלו לא מדויק נדחה שוב ושוב. | After a stale-date rejection, a customer with a skewed device clock was rejected again and again. | Checkout now uses the date the server computed (`res.deliveryDate`) on the next submit. |
| 9 | 🟡 | אין דף 404 בעברית. הוצג דף ברירת המחדל של Next באנגלית, גם עבור `/catalog/<slug-שגוי>`. | No Hebrew 404. Next's English default page was shown, including for `/catalog/<bad-slug>`. | New `app/not-found.tsx` and `app/error.tsx` (error boundary), both in Hebrew with ways back to the site. |
| 10 | 🟡 | **מובייל:** כפתורי ה-+/− בסל היו 28px וכפתור ההסרה ✕ היה 21×24px, מתחת לגודל מגע מינימלי. | **Mobile:** cart +/− buttons were 28px and the remove ✕ was 21×24px, below the touch-target minimum. | Stepper buttons are 36px+ on touch screens, ✕ is 40px, and the stepper moves under the dish name on small screens. Admin checkboxes are 24px. |
| 11 | 🟡 | תמונה שלא נטענה בסל הציגה אייקון תמונה שבורה, והטקסט החלופי גלש מחוץ לתמונה. | A cart thumbnail that failed to load showed a broken image with the alt text spilling out. | `CartThumb` falls back to the category icon, like `ProductImage` already did. |
| 12 | 🟡 | בקרוסלה הראשית, מנה שהאדמין הסתיר או סימן "אזל" המשיכה להופיע. | Hero carousel kept showing a dish the admin had hidden or marked sold out. | `DishOrbitCarousel` drops dishes that are missing from the live catalog or out of stock. |
| 13 | 🟡 | אדמין: אפשר היה להוסיף מוצר, אבל לא היה אפשר למחוק אותו. | Admin: products could be added but never deleted. | `deleteAddedProduct()` with a confirmation prompt (it also removes that product's promotions). Menu (seed) products are "deleted" by hiding them, which keeps order history (matches `OrderItem.productId → SetNull`). |
| 14 | 🟡 | אדמין: לא הייתה שום מערכת התראות (מייל / וואטסאפ), אף שהמודל `NotificationLog` קיים. | Admin: no Email/WhatsApp notifications existed, although the `NotificationLog` model does. | New `lib/notifications.ts`, with tests: customer update, new-order alert for Kai, and a daily summary. Order cards get "עדכון בוואטסאפ / במייל" buttons, and the orders screen gets "שליחת סיכום יומי בוואטסאפ". |

**שיפורים קטנים · Minor improvements**
- הטקסט "14:30" כבר לא קבוע בקוד. הבאנר, הכותרת התחתונה ותקציר ההזמנה קוראים את השעה מ-`StoreRules` (דרך `cutoffLabel()`). · The "14:30" copy now comes from `StoreRules` in the banner, footer and order summary.
- הבאנר העליון במובייל מציג את שתי ההודעות בשורות נפרדות, ולא שבור באמצע משפט. · The mobile delivery banner stacks its two messages instead of breaking mid-sentence.
- כותרות אבטחה ב-`next.config.ts`: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, ו-`X-Robots-Tag: noindex` לנתיבי `/admin`. כותרת `X-Powered-By` הוסרה. · Security headers added, `X-Powered-By` removed.

---

## 2. צד לקוח · Client-side checklist

| דרישה · Requirement | תוצאה · Result | הערות · Notes |
|---|---|---|
| שקופית 1 מציגה את קאי ואת המעדנייה · Slide 1 introduces Kai & the deli | ✅ | `WELCOME` in `data/dish-orbit.ts`: "מעדנייה ביתית · אוכל מוכן", the story, the three pillars and a chef card. The copy is marked as a placeholder for Kai's own words. |
| שקופיות מנות דינמיות לפי קטגוריה · Dynamic featured dishes by category | ✅ | `getHeroDishes(2)`: the two most popular dishes per category, by orders and likes, revalidated every 60 s. Category chips act as chapters. |
| אנימציות GSAP חלקות · Smooth GSAP animations | ✅ | Only `transform`, `opacity` and one CSS variable are animated (GPU friendly). `prefers-reduced-motion` sets every duration to 0. |
| ניגון אוטומטי + עצירה ב-hover · Autoplay + pause on hover | ✅ | `use-autoplay.ts`: 5 s. Pauses on mouse hover, keyboard focus, hidden tab, carousel off-screen, and the pause button. On touch screens there is no hover, so a touch restarts the countdown instead (by design). |
| גלישה חופשית ללא התחברות · Free browsing, no forced login | ✅ E2E | 73 products in 7 categories, with search and dietary/deals filters. No redirect to login anywhere in the catalog. |
| טעינת תמונות ללא קפיצות · Image loading without jank | ✅ | `next/image` with a fixed 4:3 frame (no layout shift). The first 4 images load eagerly with `fetchPriority=high`, the rest lazily. The Unsplash loader requests the exact width, and a failed photo falls back to an icon. |
| סטפר 0.25 ק״ג · 0.25 kg stepper | ✅ E2E | Verified in the browser: 0.25 → 0.50 → 0.75 → 1.00, and "−" goes back one quarter. Counting is done in integer steps (`toSteps`), so there is no float drift. A UNIT product moves by one unit. Pressing "−" at the minimum removes the line. |
| משלוח: מתחת ל-150 ₪ יש דמי משלוח, מ-150 ₪ חינם · Delivery fee <150 ₪, free ≥150 ₪ | ✅ E2E + unit | Boundary tested: 149.99 ₪ is charged 25 ₪, exactly 150.00 ₪ is free. Pickup is always free. The 25 ₪ fee is a placeholder (see open decisions). |
| מועד אחרון 14:30 · 14:30 cut-off → +2 days | ✅ unit | Always computed in `Asia/Jerusalem` time, including summer and winter clocks and the day changing at midnight. Exactly 14:30 counts as "after". The server re-checks the date at checkout. Saturday is closed, so an order can roll to Sunday (e.g. Thursday after 14:30 → Sunday). |
| שער התחברות בקופה + שמירת הסל · Checkout auth gate + cart persistence | ✅ E2E (fixed) | Flow: guest → cart → "המשך לקופה" → `/login?next=/checkout` → login → back on `/checkout` with the same cart (localStorage). |
| מובייל < 640px · Mobile < 640px | ✅ (fixed) | See section 5. |

---

## 3. צד שרת · Server-side & data model

### מודלים · Schema (`prisma/schema.prisma`)
| נושא · Topic | תוצאה · Result |
|---|---|
| מפתחות זרים · Foreign keys | ✅ `Product → Category` is `Restrict` (no orphaned products). `OrderItem.productId → SetNull` (deleting a product keeps history). `Order → User` is `Restrict`. Cart and Account rows are `Cascade`. |
| כמויות שבריות · Fractional quantities | ✅ `Decimal(7,2)` on `CartItem`, `OrderItem` and the min/step/max columns of `Product`. ⚠️ **Recommendation:** add a DB `CHECK (quantity > 0 AND quantity * 4 = floor(quantity * 4))` in the first migration, as a last line of defence. |
| אינדקסים · Indexes | ✅ `Order(deliveryDate, status)` serves the calendar and daily summary, `OrderItem(productId)` serves sales analytics, `Product(categoryId, isActive, sortOrder)` serves the catalog, plus `Promotion(startsAt, endsAt)`. |
| כסף · Money | ✅ Integer agorot everywhere, and orders snapshot prices, names, address and fees. |
| הזמנת אורח · Guest orders | ℹ️ `Order.userId` is required, which now matches the checkout auth gate. |

### API ואבטחה · API & security
| נושא · Topic | תוצאה · Result |
|---|---|
| אימות קלט בקופה · Checkout input validation | ✅ (hardened) Runtime shape check, every price recomputed on the server, 0.25 kg grid, per-line cap, duplicate lines, stock, phone and email formats, address, delivery date. |
| מחיר מהלקוח · Client-sent prices | ✅ Ignored. Only `productId + quantity` are sent, and the server prices them. ⚠️ In **mock mode** the browser's admin overlay is used for pricing (documented). In `CATALOG_SOURCE=db` it is ignored. |
| סודות · Secrets | ✅ `.env` is in `.gitignore`, and `git grep` found no keys in the repo. The `NEXT_PUBLIC_SUPABASE_*` values are public by design. `OPENAI_API_KEY` and `UNSPLASH_ACCESS_KEY` are used only by local scripts. |
| Open redirect | ✅ (new) `safeNextPath()` is tested against `//`, `/\`, `https:`, `javascript:` and control characters. |
| 🔴 **נשאר פתוח · Still open (blocker before go-live)** | The mock login and admin gate run **only in the browser**: the admin password `123456` is in the client code, and users and orders live in localStorage. Before real customers: real auth (Supabase/Auth.js), an admin role check **on the server** for every admin action, and orders written to the DB. This is already documented in the README. |

---

## 4. דשבורד אדמין · Admin dashboard

| דרישה · Requirement | תוצאה · Result | הערות · Notes |
|---|---|---|
| הוספה / עריכה / מחיקה של מוצרים · Product CRUD | ✅ (delete added) | Add, edit name/price, stock status (in stock / low / out), hide from the site, reset to original, **delete** (for products added in the admin, with confirmation). |
| מבצעים · Promotions | ✅ | Percent off / amount off / fixed price, on a product or a whole category, with start and end dates. The best live promotion wins (`getEffectivePrice`). |
| הזמנות: עתידיות / עבר · Orders timeline | ✅ | Today / tomorrow / all. Upcoming days first, then past days (3 shown, the rest on request). Kitchen view, delivery-zone view, and per-order cards with quick status steps. |
| התראות מייל / וואטסאפ · Email/WhatsApp triggers | 🟡 Partial (new) | Messages are built and sent **by a tap** (wa.me / mailto). ⚠️ Automatic sending needs a provider (WhatsApp Cloud API / Resend), a server job, and `NotificationLog` rows. The builders in `lib/notifications.ts` are ready to reuse. |
| דו״ח יומי · Daily summary | ✅ (new) | Orders, revenue, deliveries vs pickups, cancellations, and kitchen totals per dish (0.25 kg steps stay exact). There is also the KPI bar and the overview screen (daily / weekly / monthly). |
| התפלגות מכירות · Sales distribution | ✅ | Revenue per customer, per zone, best and worst sellers. Covered by `admin-analytics.test.ts`. |

---

## 5. מובייל · Mobile adaptation

**שיטה · Method:** Playwright with a touch-screen emulation at **320 / 360 / 390px**, on all 13 routes (including admin and 404). For each page we measured `scrollWidth` against the viewport width, found any element sticking out of the screen, and flagged tap targets smaller than 32px.

| מסך · Screen | לפני · Before | אחרי · After |
|---|---|---|
| כל העמודים @320px · All pages @320px | ❌ 352px (header) | ✅ 320px |
| סל @360/390 · Cart @360/390 | ❌ 507px | ✅ |
| ניווט ראשי · Main nav | ❌ none on phones | ✅ scrollable row |
| סטפר בסל / ✕ · Cart stepper / ✕ | ❌ 28px / 21×24px | ✅ 36px / 40px |
| צ׳קבוקס במטבח · Kitchen checkboxes | 20px | 24px |
| קרוסלה · Hero carousel | ✅ | Horizontal swipe (`touch-pan-y` keeps vertical scrolling native). Pinning to the scroll happens on desktop only. |
| טבלאות אדמין · Admin tables | ✅ | Section pills scroll sideways on their own, without the page scrolling. |

**נשאר (נמוך) · Remaining (low):** inline text links such as "לכל התפריט ←" and "→ חזרה לסל" are about 20px tall. That is acceptable for inline text links, but they could get padding.

---

## 6. מקרי קצה שנבדקו · Edge cases covered by tests

- הזמנה ב-14:29 מגיעה מחר. ב-14:30 וב-23:59 היא מגיעה מחרתיים. · 14:29 → tomorrow; 14:30 and 23:59 → day after tomorrow.
- 00:30 שעון ישראל, כשבשעון UTC זה עדיין היום הקודם. · 00:30 Israel time while UTC is still on the previous day.
- שעון קיץ (UTC+3) מול שעון חורף (UTC+2). · Summer time (UTC+3) vs winter time (UTC+2).
- יום חמישי אחרי 14:30 עובר ליום ראשון (שבת סגורה). אפשר להגדיר ימים סגורים אחרים. · Thursday after the cut-off → Sunday (Saturday closed); custom closed days.
- מעבר חודש ושנה: 30.12 אחרי 14:30 מגיעה ב-01.01. · Month/year rollover (30.12 after the cut-off → 01.01).
- תאריך שהתיישן כי הטאב נשאר פתוח אחרי 14:30 נדחה בשרת. · A date gone stale (tab left open past 14:30) is rejected by the server.
- כמויות: NaN, שליליות, אינסוף, 0, כמות שאינה רבע קילו, 30.25 ק״ג, 51 יחידות – כולן נדחות. · Quantities NaN, negative, ∞, 0, off-grid, 30.25 kg and 51 units are all rejected.
- הסכום 149.99 ₪ משלם דמי משלוח, 150.00 ₪ לא. · 149.99 ₪ pays the fee; 150.00 ₪ does not.
- קלט שבור לפעולת השרת (null, מספר, מחרוזת, מערכים שבורים) לא מקריס אותה. · Malformed server-action input (null, number, string, broken arrays) doesn't crash it.
- open redirect: `//evil.com`, `/\evil.com`, `javascript:`, תווי בקרה. · Open-redirect attempts are rejected.
- מספרי טלפון ישראליים מומרים לפורמט וואטסאפ, וקישורי wa.me ו-mailto מקודדים נכון. · Israeli phone numbers convert to the WhatsApp format; wa.me and mailto links are encoded correctly.

**E2E (`390px`, touch):** browsing without login (73 products) · KG stepper 0.25→1.00 and back · guest link to `/login?next=/checkout` · gate on direct `/checkout` access · return to checkout after login with the cart kept · open redirect blocked · 25 ₪ fee under 150 ₪ · order placed and confirmed by the server.

> הערת סביבה · Environment note: in the test environment `images.unsplash.com` was blocked by the network, so photos showed their fallback icon. That is how we caught defect #11 (the broken cart thumbnail).

---

## 7. החלטות פתוחות והמלצות · Open decisions & recommendations

1. **🔴 אימות אמיתי ובדיקת הרשאות בשרת** לפני עלייה לאוויר (ראו סעיף 3). · **Real auth + server-side admin checks** before go-live.
2. **דמי משלוח:** 25 ₪ הם עדיין מספר זמני. קאי צריך לאשר את הסכום. · **Delivery fee:** 25 ₪ is still a placeholder for Kai to confirm.
3. **`StoreSettings` בצד הלקוח:** הלקוח קורא את `DEFAULT_RULES`. כשקאי ישנה הגדרות ב-DB, צריך להעביר את `rules` מהשרת לרכיבים (הבאנר, הסל, הקופה). · The client reads `DEFAULT_RULES`; once Kai edits DB settings, pass `rules` from the server to the banner, cart and checkout.
4. **שליחת התראות אוטומטית:** ספק + Job בשרת + רישום ב-`NotificationLog`. הבונים כבר מוכנים. · **Automatic notifications:** provider + server job + `NotificationLog`; the message builders are ready.
5. **CHECK constraint** על כמויות ב-DB (סעיף 3). · Add the DB CHECK constraint on quantities (section 3).
6. **CSP:** להוסיף Content-Security-Policy מותאם (GSAP, Unsplash, Supabase). · Add a tuned Content-Security-Policy (GSAP, Unsplash, Supabase).
7. **מחיר בסל:** שורה בסל שומרת את המחיר מרגע ההוספה עד הקופה (בקופה השרת מתמחר מחדש). כדאי לרענן מחירים בסל מול הקטלוג החי. · **Cart price:** a cart line keeps the price it was added at until checkout (where the server re-prices); refreshing cart prices against the live catalog is a nice-to-have.
