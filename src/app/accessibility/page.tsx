import type { Metadata } from "next";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של סופר-קאי: התאמות שבוצעו באתר, כלי הנגישות ודרכי פנייה לרכז הנגישות.",
};

/** Update whenever the site's accessibility is reviewed again. */
const LAST_UPDATED = "24.11.2026";

/**
 * Accessibility statement, as required by the Equal Rights for Persons with
 * Disabilities (Service Accessibility Adjustments) Regulations, 2013, reg. 35.
 * The coordinator's name is a placeholder — fill in before going live, and
 * have the site audited by an accessibility professional.
 */
const features = [
  "ניווט מלא במקלדת (Tab / Shift+Tab, Enter, Esc ומקשי החיצים בקרוסלה), עם מסגרת מיקוד בולטת.",
  "קישור “דילוג לתוכן הראשי” בתחילת כל עמוד.",
  "מבנה כותרות היררכי, תגיות סמנטיות ותוויות לכל כפתור, שדה וטופס.",
  "טקסט חלופי לתמונות המנות, ואייקונים דקורטיביים מוסתרים מקוראי מסך.",
  "התאמה לקוראי מסך (NVDA, JAWS, VoiceOver), כולל הכרזה על שינויים דינמיים כמו עדכון כמות בסל.",
  "האתר רספונסיבי ומותאם לנייד, לטאבלט ולמחשב, וניתן להגדלה עד 200% בלי אובדן תוכן.",
  "הקרוסלה בדף הבית נעצרת במעבר עכבר, במיקוד מקלדת ובכפתור ההשהיה, ומכבדת את הגדרת “הפחתת תנועה” במערכת ההפעלה.",
];

const toolbar = [
  "הגדלה והקטנה של גודל הטקסט (עד 150%)",
  "ניגודיות גבוהה",
  "הדגשת קישורים",
  "גופן קריא ומרווחי שורות מוגדלים",
  "הדגשת ניווט מקלדת",
  "עצירת אנימציות ותנועה",
  "איפוס כל ההגדרות",
];

export default function AccessibilityPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-sm font-bold text-brand-600">נגישות</p>
      <h1 className="font-display text-4xl font-bold">הצהרת נגישות</h1>
      <p className="mt-2 text-sm text-muted">עודכנה לאחרונה: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-10 leading-relaxed">
        <section aria-labelledby="commitment">
          <h2 id="commitment" className="font-display text-2xl font-bold">
            המחויבות שלנו
          </h2>
          <p className="mt-2">
            בסופר-קאי אנחנו מאמינים שכל אחד צריך ליהנות מאוכל ביתי טוב – וגם מאתר שנוח להזמין בו. פעלנו להנגיש את האתר
            בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג-2013, ולתקן הישראלי ת״י 5568,
            המבוסס על הנחיות WCAG 2.1 ברמה AA.
          </p>
        </section>

        <section aria-labelledby="adjustments">
          <h2 id="adjustments" className="font-display text-2xl font-bold">
            ההתאמות שבוצעו באתר
          </h2>
          <ul className="mt-3 list-disc space-y-2 ps-6">
            {features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="toolbar">
          <h2 id="toolbar" className="font-display text-2xl font-bold">
            תפריט הנגישות
          </h2>
          <p className="mt-2">
            בכל עמוד באתר, בצד המסך, נמצא כפתור הנגישות (אפשר לפתוח אותו גם בקיצור המקלדת Alt+A). ההגדרות נשמרות בדפדפן
            שלכם ויחולו גם בביקור הבא:
          </p>
          <ul className="mt-3 grid list-disc gap-x-8 gap-y-1 ps-6 sm:grid-cols-2">
            {toolbar.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="browsers">
          <h2 id="browsers" className="font-display text-2xl font-bold">
            דפדפנים ועזרים
          </h2>
          <p className="mt-2">
            האתר מותאם לגרסאות העדכניות של Chrome, Edge, Firefox ו-Safari, במחשב ובנייד, ולעבודה עם קוראי מסך ועם תוכנות
            הגדלה.
          </p>
        </section>

        <section aria-labelledby="limits">
          <h2 id="limits" className="font-display text-2xl font-bold">
            הסתייגות
          </h2>
          <p className="mt-2">
            למרות מאמצינו, ייתכן שחלקים מסוימים באתר עדיין אינם נגישים במלואם – למשל תמונות של צלמים חיצוניים או תכנים
            שמתעדכנים מדי יום. אנחנו ממשיכים לשפר את הנגישות באופן שוטף. אם נתקלתם בבעיה, נשמח שתספרו לנו ונטפל בה בהקדם.
          </p>
        </section>

        <section aria-labelledby="coordinator" className="rounded-3xl bg-paper p-6 ring-1 ring-line">
          <h2 id="coordinator" className="font-display text-2xl font-bold">
            פנייה לרכז הנגישות
          </h2>
          <p className="mt-2">נתקלתם בקושי, או צריכים את המידע באתר בפורמט אחר? אפשר לפנות אלינו ונחזור אליכם תוך 5 ימי עבודה.</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
            <dt className="font-bold">רכז הנגישות</dt>
            <dd>קאי, השף והבעלים</dd>
            <dt className="font-bold">טלפון</dt>
            <dd>
              <a href={CONTACT.phoneHref} dir="ltr" className="font-medium text-brand-600 hover:underline">
                {CONTACT.phoneDisplay}
              </a>
            </dd>
            <dt className="font-bold">דוא״ל</dt>
            <dd>
              <a href={`mailto:${CONTACT.email}`} className="font-medium text-brand-600 hover:underline">
                {CONTACT.email}
              </a>
            </dd>
          </dl>
          <p className="mt-4 text-sm text-muted">
            האיסוף העצמי מתבצע מהמטבח בתיאום מראש. אם אתם זקוקים להתאמה כלשהי באיסוף, ספרו לנו בעת ההזמנה.
          </p>
        </section>
      </div>
    </article>
  );
}
