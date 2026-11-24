import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";

export const metadata: Metadata = {
  title: "מדיניות פרטיות ועוגיות",
  description: "איזה מידע סופר-קאי שומר, למה, ואיך לשנות את הגדרות העוגיות.",
};

const stored = [
  { what: "סל הקניות", why: "כדי שהמנות שבחרתם יישמרו בין הדפים ובביקור הבא.", kind: "הכרחי" },
  { what: "התחברות לחשבון", why: "כדי לזהות אתכם בקופה ולהציג את ההזמנות שלכם.", kind: "הכרחי" },
  { what: "הגדרות נגישות", why: "כדי שגודל הטקסט, הניגודיות ושאר ההגדרות יישמרו.", kind: "הכרחי" },
  { what: "בחירת העוגיות שלכם", why: "כדי לזכור את ההסכמה (או הסירוב) ולא לשאול שוב.", kind: "הכרחי" },
  { what: "סטטיסטיקת שימוש", why: "הבנה אילו דפים ומנות מעניינים, לשיפור האתר.", kind: "רק בהסכמה" },
  { what: "שיווק", why: "הצגת מבצעים והמלצות מותאמים.", kind: "רק בהסכמה" },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-sm font-bold text-brand-600">פרטיות</p>
      <h1 className="font-display text-4xl font-bold">מדיניות פרטיות ועוגיות</h1>

      <div className="mt-8 space-y-10 leading-relaxed">
        <section aria-labelledby="what">
          <h2 id="what" className="font-display text-2xl font-bold">
            מה אנחנו שומרים ולמה
          </h2>
          <p className="mt-2">
            האתר שומר מידע בדפדפן שלכם (עוגיות ואחסון מקומי) רק לצרכים שמפורטים כאן. מידע שאינו הכרחי לפעולת האתר נשמר רק
            אם אישרתם זאת.
          </p>
          <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-line">
            <table className="w-full bg-paper text-sm">
              <caption className="sr-only">סוגי המידע שהאתר שומר</caption>
              <thead className="bg-cream text-start">
                <tr>
                  <th scope="col" className="p-3 text-start">
                    מידע
                  </th>
                  <th scope="col" className="p-3 text-start">
                    מטרה
                  </th>
                  <th scope="col" className="p-3 text-start">
                    סוג
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stored.map((s) => (
                  <tr key={s.what}>
                    <td className="p-3 font-medium">{s.what}</td>
                    <td className="p-3 text-muted">{s.why}</td>
                    <td className="whitespace-nowrap p-3">{s.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            תמונות המנות נטענות משירות התמונות Unsplash. פרטי ההזמנה (שם, טלפון וכתובת) משמשים אך ורק להכנת ההזמנה ולמשלוח
            שלה.
          </p>
        </section>

        <section aria-labelledby="choice">
          <h2 id="choice" className="font-display text-2xl font-bold">
            שינוי ההסכמה
          </h2>
          <p className="mt-2">
            אפשר לשנות את הבחירה בכל רגע:{" "}
            <CookieSettingsLink className="font-bold text-brand-600 underline underline-offset-2" />. אפשר גם למחוק עוגיות
            ואחסון מקומי דרך הגדרות הדפדפן.
          </p>
        </section>

        <section aria-labelledby="rights">
          <h2 id="rights" className="font-display text-2xl font-bold">
            הזכויות שלכם
          </h2>
          <p className="mt-2">
            לפי חוק הגנת הפרטיות, תוכלו לבקש לעיין במידע שנשמר עליכם, לתקן אותו או למחוק אותו. פנו אלינו בטלפון{" "}
            <a href={CONTACT.phoneHref} dir="ltr" className="font-medium text-brand-600 hover:underline">
              {CONTACT.phoneDisplay}
            </a>{" "}
            או בדוא״ל{" "}
            <a href={`mailto:${CONTACT.email}`} className="font-medium text-brand-600 hover:underline">
              {CONTACT.email}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
