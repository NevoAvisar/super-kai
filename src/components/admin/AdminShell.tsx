"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BadgePercent, ChefHat, LayoutDashboard, Package, Users } from "lucide-react";
import { AccountGate } from "@/components/auth/AccountGate";
import { isActive, statusBreakdown, todayDateOnly } from "@/lib/admin-analytics";
import { DEMO_THRESHOLD, generateDemoOrders, type DemoProduct } from "@/lib/demo-orders";
import { formatILS } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrdersStore } from "@/store/admin";

const sections = [
  { href: "/admin", label: "סקירה כללית", icon: LayoutDashboard },
  { href: "/admin/orders", label: "הזמנות והכנות מטבח", icon: ChefHat },
  { href: "/admin/customers", label: "לקוחות", icon: Users },
  { href: "/admin/products", label: "מוצרים", icon: Package },
  { href: "/admin/promotions", label: "מבצעים", icon: BadgePercent },
];

/** Today's numbers, shown above every admin screen. */
function KpiBar() {
  const hydrated = useHydrated();
  const orders = useOrdersStore((s) => s.orders);
  const today = todayDateOnly();
  const todays = hydrated ? orders.filter((o) => o.deliveryDate === today && o.status !== "CANCELLED") : [];
  const live = statusBreakdown(hydrated ? orders.filter(isActive) : []);
  const stats = [
    { label: "הכנסות היום", value: formatILS(todays.reduce((n, o) => n + o.totals.totalAgorot, 0)), dot: "bg-brand-500" },
    { label: "משלוחים היום", value: todays.filter((o) => o.fulfillment === "DELIVERY").length, dot: "bg-viz-violet" },
    { label: "ממתינות לאישור", value: live.pending, dot: "bg-viz-yellow" },
    { label: "פתוחות / בהכנה", value: live.open, dot: "bg-viz-blue" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line md:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-paper px-4 py-3">
          <dt className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`size-2 rounded-full ${s.dot}`} aria-hidden />
            {s.label}
          </dt>
          <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Frame of every /admin screen: admin-only gate, the section sidebar (on the
 * right in RTL; a scrolling row of pills on small screens), today's KPI bar and
 * the local-data notice. It also loads the sample orders the first time the
 * dashboard opens with hardly any real ones.
 */
export function AdminShell({ products, children }: { products: DemoProduct[]; children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const { orders, demoSeeded, seedDemo } = useOrdersStore.getState();
    if (!demoSeeded && orders.length < DEMO_THRESHOLD) seedDemo(generateDemoOrders(products));
    // The overview's "load sample orders" link asks for them again after they were removed.
    const reseed = () => seedDemo(generateDemoOrders(products));
    window.addEventListener("super-kai:seed-demo", reseed);
    return () => window.removeEventListener("super-kai:seed-demo", reseed);
  }, [products]);

  return (
    <AccountGate adminOnly>
      {(user) => (
        <div className="mx-auto max-w-7xl px-4 py-8 lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-32 lg:h-fit">
            <div className="lg:rounded-3xl lg:bg-paper lg:p-4 lg:ring-1 lg:ring-line">
              <p className="text-sm font-bold text-leaf-600">שלום, {user.name}</p>
              <p className="font-display text-2xl font-bold">ניהול סופר-קאי</p>
              <nav aria-label="אזורי הניהול" className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
                {sections.map((t) => {
                  const on = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
                  return (
                    <Link
                      key={t.href}
                      href={t.href}
                      aria-current={on ? "page" : undefined}
                      className={`flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-sm font-bold transition lg:rounded-xl lg:px-3 lg:py-2.5 ${
                        on ? "bg-ink text-paper" : "bg-paper ring-1 ring-line hover:bg-brand-50 lg:bg-transparent lg:ring-0"
                      }`}
                    >
                      <t.icon className="size-4 shrink-0" aria-hidden />
                      {t.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <div className="mt-5 min-w-0 space-y-5 lg:mt-0">
            <KpiBar />
            <p className="rounded-2xl bg-brand-50 px-4 py-2.5 text-xs text-brand-700 sm:text-sm">
              <b>מצב הדגמה.</b> הנתונים נשמרים בדפדפן הזה בלבד: הם לא מאובטחים, ולקוחות במכשירים אחרים לא יראו אותם עד שהאתר יחובר לשרת.
            </p>
            <div>{children}</div>
          </div>
        </div>
      )}
    </AccountGate>
  );
}

/** Shared field styles for the admin forms. */
export const inputClass =
  "w-full rounded-xl bg-paper px-3.5 py-2.5 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand-500";
export const primaryButton =
  "rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-brand-500 disabled:bg-line";
export const quietButton = "rounded-full px-4 py-2 text-sm font-bold ring-1 ring-line transition hover:bg-brand-50";

export function Labeled({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {error && <span className="block text-xs text-brand-700">{error}</span>}
    </label>
  );
}

/** "12.50" → 1250 agorot; null when it isn't a valid, non-negative amount. */
export function parseShekels(text: string): number | null {
  const n = Number(text.trim().replace(",", "."));
  return text.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export const shekelsText = (agorot: number) => String(agorot / 100);
