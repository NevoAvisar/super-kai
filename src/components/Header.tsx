import Link from "next/link";
import { AuthMenu } from "./auth/AuthMenu";
import { CartButton } from "./CartButton";
import { DeliveryBanner } from "./DeliveryBanner";

const nav = [
  { href: "/", label: "דף הבית" },
  { href: "/catalog", label: "התפריט" },
  { href: "/#about", label: "מי אנחנו" },
  { href: "/#how-it-works", label: "איך זה עובד" },
  { href: "/contact", label: "צור קשר" },
];

export function Header() {
  // Perf (QA): on phones the header is solid; the blur behind a 95%-opaque background was
  // invisible but re-painted on every scroll frame. HE: ביטול טשטוש הרקע בכותרת במובייל לגלילה חלקה.
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper sm:bg-paper/95 sm:backdrop-blur">
      <DeliveryBanner />
      {/* QA (mobile): at 320px the row was 352px wide (logo text-3xl + gap-6), so every page scrolled sideways. */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-2xl font-bold text-ink sm:text-3xl">
          סופר<span className="text-brand-500">-</span>קאי
        </Link>
        <nav aria-label="ניווט ראשי" className="hidden gap-5 text-sm font-medium md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-600">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Login is optional while browsing — enforced only at checkout (step 2). */}
          <AuthMenu />
          <CartButton />
        </div>
      </div>
      {/* QA fix (mobile): the main nav was `hidden md:flex` with no replacement, so on phones
          "התפריט" / "איך זה עובד" were unreachable from the header. A scrollable row of links now shows below md.
          HE: במובייל לא היה תפריט ניווט בכלל – נוספה שורת קישורים גלילה. */}
      <nav aria-label="ניווט ראשי" className="border-t border-line md:hidden">
        <ul className="flex gap-1 overflow-x-auto px-3 py-1.5 text-sm font-medium [scrollbar-width:none]">
          {nav.map((n) => (
            <li key={n.href} className="shrink-0">
              <Link href={n.href} className="block rounded-full px-3 py-1.5 hover:bg-brand-50 hover:text-brand-600">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
