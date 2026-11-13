import Link from "next/link";
import { CartButton } from "./CartButton";
import { DeliveryBanner } from "./DeliveryBanner";

const nav = [
  { href: "/", label: "דף הבית" },
  { href: "/catalog", label: "התפריט" },
  { href: "/#about", label: "מי אנחנו" },
  { href: "/#how-it-works", label: "איך זה עובד" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <DeliveryBanner />
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-3xl font-bold text-ink">
          סופר<span className="text-brand-500">-</span>קאי
        </Link>
        <nav className="hidden gap-5 text-sm font-medium md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-600">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-3">
          {/* Login is optional while browsing — enforced only at checkout (step 2). */}
          <Link href="/login" className="text-sm font-medium hover:text-brand-600">
            התחברות
          </Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
