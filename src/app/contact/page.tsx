import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "צור קשר",
  description: `מעדיפים להזמין בטלפון? חייגו ${CONTACT.phoneDisplay} ונרשום את ההזמנה בשבילכם.`,
};

const phoneSteps = [
  "מעיינים בתפריט ובוחרים מנות – אפשר גם לשאול אותנו מה מומלץ היום.",
  "מתקשרים ומכתיבים את ההזמנה, הכתובת ויום האספקה.",
  "מקבלים מאיתנו אישור הזמנה עם הסכום ומועד האספקה.",
];

/** Contact page, mainly for customers who prefer to order by phone. */
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <p className="text-sm font-bold text-brand-600">צור קשר</p>
      <h1 className="font-display text-4xl font-bold">מעדיפים להזמין בטלפון?</h1>
      <p className="mt-2 max-w-2xl text-muted">
        אין בעיה – חייגו אלינו ונרשום את ההזמנה בשבילכם. אותם מחירים, אותם מועדי אספקה: הזמנה עד {CONTACT.cutoff} מגיעה כבר
        מחר.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="phone-orders" className="rounded-3xl bg-paper p-8 ring-1 ring-line lg:col-span-3">
          <h2 id="phone-orders" className="font-display text-2xl font-bold">
            הזמנות טלפוניות
          </h2>
          <a
            href={CONTACT.phoneHref}
            className="mt-5 flex items-center gap-4 rounded-2xl bg-ink p-5 text-paper transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-500">
              <Phone className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-sm opacity-80">לחצו לחיוג</span>
              <span dir="ltr" className="block font-display text-3xl font-bold tracking-wide">
                {CONTACT.phoneDisplay}
              </span>
            </span>
          </a>

          <ol className="mt-8 space-y-4">
            {phoneSteps.map((text, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-display text-2xl font-bold text-brand-100" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="pt-1 text-sm">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="phone-hours" className="rounded-3xl bg-paper p-8 ring-1 ring-line">
            <h2 id="phone-hours" className="flex items-center gap-2 font-display text-xl font-bold">
              <Clock className="size-5 text-brand-600" aria-hidden />
              שעות מענה טלפוני
            </h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {CONTACT.phoneHours.map((h) => (
                <div key={h.days} className="flex justify-between py-2">
                  <dt className="text-muted">{h.days}</dt>
                  <dd className="font-medium">{h.hours}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="other-channels" className="rounded-3xl bg-cream p-8 ring-1 ring-line">
            <h2 id="other-channels" className="font-display text-xl font-bold">
              דרכים נוספות
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-brand-600" aria-hidden />
                <a href={`mailto:${CONTACT.email}`} className="underline-offset-4 hover:text-brand-600 hover:underline">
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-brand-600" aria-hidden />
                איסוף עצמי מהמטבח – בתיאום מראש
              </li>
            </ul>
            <Link href="/catalog" className="mt-6 inline-block text-sm font-bold text-brand-600 hover:underline">
              או הזמינו אונליין מהתפריט ←
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
