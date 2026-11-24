import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { CookieSettingsLink } from "./consent/CookieSettingsLink";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-brand-600">סופר-קאי</p>
          <p>אוכל מוכן ביתי, מבושל באהבה כל יום מחדש.</p>
        </div>
        <div>
          <p className="font-semibold text-ink">שעות הזמנה</p>
          <p>הזמנה עד {CONTACT.cutoff} – אספקה למחרת</p>
          <p>אין אספקה בשבת</p>
        </div>
        <div>
          <p className="font-semibold text-ink">יצירת קשר</p>
          <p>
            הזמנות טלפוניות:{" "}
            <a href={CONTACT.phoneHref} dir="ltr" className="font-medium text-ink hover:text-brand-600">
              {CONTACT.phoneDisplay}
            </a>
          </p>
          <p>WhatsApp · מייל · איסוף עצמי מהמטבח</p>
          <Link href="/contact" className="font-medium text-brand-600 hover:underline">
            לכל פרטי ההתקשרות ←
          </Link>
        </div>
      </div>
      <nav aria-label="מידע משפטי" className="flex flex-wrap justify-center gap-x-4 gap-y-1 pb-2 text-xs text-muted">
        <Link href="/accessibility" className="hover:text-brand-600 hover:underline">
          הצהרת נגישות
        </Link>
        <Link href="/privacy" className="hover:text-brand-600 hover:underline">
          מדיניות פרטיות ועוגיות
        </Link>
        <CookieSettingsLink className="hover:text-brand-600 hover:underline" />
      </nav>
      <p className="pb-6 text-center text-xs text-muted">© {new Date().getFullYear()} סופר-קאי</p>
    </footer>
  );
}
