import type { Metadata } from "next";
import { connection } from "next/server";
import { getCategories } from "@/lib/catalog";
import { getHeroDishes } from "@/lib/hero-dishes";
import { DishOrbitCarousel } from "@/components/dish-orbit/DishOrbitCarousel";
import { PortionGuide } from "@/components/PortionGuide";
import { portionLinks } from "@/lib/portion-links";
import { DEFAULT_RULES } from "@/lib/config";
import { formatILS } from "@/lib/money";
import { SHARED_OPEN_GRAPH } from "@/lib/site-metadata";

// Link preview for the home page: the shared card plus og:url = the site root.
export const metadata: Metadata = { openGraph: { ...SHARED_OPEN_GRAPH, url: "/" } };

const cutoff = `${DEFAULT_RULES.cutoffHour}:${String(DEFAULT_RULES.cutoffMinute).padStart(2, "0")}`;
const steps = [
  { n: "01", title: "גולשים בחופשיות", text: "כל התפריט פתוח – בלי הרשמה ובלי התחייבות." },
  { n: "02", title: "שוקלים בדיוק", text: "כל לחיצה מוסיפה רבע קילו. מרקים וממרחים – במנות מוכנות." },
  { n: "03", title: "משלוח או איסוף", text: `משלוח חינם מעל ${formatILS(DEFAULT_RULES.freeDeliveryThresholdAgorot)}, או איסוף עצמי מהמטבח.` },
  { n: "04", title: "מקבלים מחר", text: `הזמנה עד ${cutoff} מגיעה כבר מחר. אחרי ${cutoff} – ביום שלמחרת.` },
];

/**
 * The home page is the orbit carousel: Kai's welcome & story, then popular
 * dishes of each category. Below it, only the practical "how it works".
 */
export default async function HomePage() {
  // Rendered per request: every visit / refresh draws a new featured line-up.
  await connection();
  const [categories, dishes] = await Promise.all([getCategories(), getHeroDishes(2, { varied: true })]);
  const links = portionLinks(categories);

  return (
    <>
      <DishOrbitCarousel dishes={dishes} />

      <section id="how-it-works" className="scroll-mt-28 bg-paper py-20">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-sm font-bold text-brand-600">איך זה עובד?</p>
          <h2 className="mb-10 font-display text-4xl font-bold">מעדנייה מלאה, עד הבית</h2>
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
    </>
  );
}
