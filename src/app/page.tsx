import Link from "next/link";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/catalog";
import { CoverImage } from "@/components/CoverImage";
import { ProductGrid } from "@/components/ProductGrid";
import { PortionGuide } from "@/components/PortionGuide";
import { portionLinks } from "@/lib/portion-links";
import { DEFAULT_RULES } from "@/lib/config";
import { formatILS } from "@/lib/money";

const steps = [
  { n: "01", title: "גולשים בחופשיות", text: "כל התפריט פתוח – בלי הרשמה ובלי התחייבות." },
  { n: "02", title: "שוקלים בדיוק", text: "כל לחיצה מוסיפה רבע קילו. מרקים וממרחים – במנות מוכנות." },
  { n: "03", title: "משלוח או איסוף", text: `משלוח חינם מעל ${formatILS(DEFAULT_RULES.freeDeliveryThresholdAgorot)}, או איסוף עצמי מהמטבח.` },
  { n: "04", title: "מקבלים מחר", text: "הזמנה עד 14:30 מגיעה כבר מחר. אחרי 14:30 – ביום שלמחרת." },
];

export default async function HomePage() {
  const [categories, featured, products] = await Promise.all([getCategories(), getFeaturedProducts(8), getProducts()]);
  const links = portionLinks(categories);
  // Cover photo per category: its first featured dish, else its first dish.
  const cover = (slug: string) =>
    (products.find((p) => p.categorySlug === slug && p.isFeatured && p.imageUrl) ??
      products.find((p) => p.categorySlug === slug && p.imageUrl))?.imageUrl ?? null;
  const aboutPhoto = products.find((p) => p.slug === "slow-braised-brisket")?.imageUrl ?? cover("main-courses");

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.1fr_1fr] md:py-24">
          <div className="space-y-6">
            <p className="text-sm font-bold tracking-wide text-brand-600">מעדנייה ביתית · אוכל מוכן</p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl">
              אוכל של בית,
              <br />
              <span className="text-brand-500">ברמה של מעדנייה.</span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted">
              ראשונות, עיקריות, תוספות ומרקים שקאי מבשל כל בוקר מחדש – נמכרים לפי משקל, בדיוק בכמות שאתם צריכים.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/catalog" className="rounded-full bg-ink px-7 py-3.5 font-bold text-paper transition hover:bg-brand-500">
                לתפריט המלא
              </Link>
              <PortionGuide links={links} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.slice(0, 4).map((c, i) => (
              <Link
                key={c.slug}
                href={`/catalog/${c.slug}`}
                className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[26px] ring-1 ring-line transition hover:-translate-y-1 hover:shadow-lg ${i % 2 ? "translate-y-6" : ""}`}
              >
                <CoverImage src={cover(c.slug)} alt={c.name} priority />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="relative p-5 text-white">
                  <span className="font-display text-xl font-bold">{c.name}</span>
                  <span className="mt-0.5 block text-xs text-white/80">{c.description}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 1 — About us */}
      <section id="about" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-20">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] ring-1 ring-line">
            <CoverImage src={aboutPhoto} alt="מהמטבח של קאי" />
          </div>
          <div className="space-y-5">
            <p className="text-sm font-bold text-brand-600">מי אנחנו?</p>
            <h2 className="font-display text-4xl font-bold">הסיפור של קאי</h2>
            {/* Placeholder copy — replace with Kai's real story */}
            <p className="leading-relaxed text-muted">
              קאי מבשל אוכל ביתי כבר שנים – קודם למשפחה ולחברים, ואז לכל השכונה. סופר-קאי נולד מתוך רצון פשוט: שכל
              אחד יוכל להגיש לשולחן אוכל של בית, טרי ואמיתי, בלי לעמוד שעות במטבח.
            </p>
            <p className="leading-relaxed text-muted">
              כל המנות מוכנות בכל בוקר מחומרי גלם טריים וללא חומרים משמרים. בשר בבישול של שעות, דגים טריים, סלטים
              שנחתכים ביד – ומרקים שמתבשלים כל הלילה.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 — What we sell / how it works */}
      <section id="how-it-works" className="scroll-mt-28 border-y border-line bg-paper py-20">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-sm font-bold text-brand-600">מה אנחנו מוכרים?</p>
          <h2 className="mb-3 font-display text-4xl font-bold">מעדנייה מלאה, עד הבית</h2>
          <p className="mb-12 max-w-2xl text-muted">
            כ-70 מנות ב-{categories.length} קטגוריות – מראשונות ועד ארוחות שלמות. משלמים בצורה מאובטחת,
            והחשבונית נשלחת במייל מיד עם סיום ההזמנה.
          </p>
          <ol className="grid gap-px overflow-hidden rounded-3xl bg-line ring-1 ring-line sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="bg-paper p-7">
                <span className="font-display text-4xl font-bold text-brand-100">{s.n}</span>
                <h3 className="mt-2 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-3 rounded-3xl bg-cream p-6">
            <p className="font-display text-xl font-bold">מארחים? לא בטוחים כמה להזמין?</p>
            <p className="text-sm text-muted">מחשבון הכמויות שלנו בנוי לפי סטנדרט קייטרינג – עד 600 גרם אוכל לסועד.</p>
            <div className="ms-auto">
              <PortionGuide links={links} label="למחשבון הכמויות" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl font-bold">האהובים של המעדנייה</h2>
          <Link href="/catalog" className="font-bold text-brand-600 hover:underline">
            לכל התפריט ←
          </Link>
        </div>
        <ProductGrid products={featured} />
      </section>
    </>
  );
}

// Re-read the catalog (prices, stock, promotions) at most once a minute.
export const revalidate = 60;
