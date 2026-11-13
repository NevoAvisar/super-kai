"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listCustomerAccounts } from "@/context/AuthContext";
import type { CatalogProduct } from "@/lib/catalog";
import { adminProducts, allPromotions, buildCustomers, promotionPhase, type AdminCustomer } from "@/lib/local-admin";
import { useLocalAdminData, useMinuteClock } from "@/lib/use-live-catalog";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrdersStore } from "@/store/admin";

export function AdminOverview({ products }: { products: CatalogProduct[] }) {
  const hydrated = useHydrated();
  const data = useLocalAdminData();
  const now = useMinuteClock();
  const orders = useOrdersStore((s) => s.orders);

  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  useEffect(() => setCustomers(buildCustomers(listCustomerAccounts(), orders)), [orders]);

  const rows = adminProducts(products, hydrated ? data : { overrides: {}, added: [], promotions: [] }, now);
  const promos = allPromotions(products, hydrated ? data : { overrides: {}, added: [], promotions: [] });
  const open = hydrated ? orders.filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length : 0;

  const sections = [
    {
      href: "/admin/products",
      title: "מוצרים",
      text: "עריכת שם, מחיר, מלאי והצגה באתר, והוספת מנות חדשות.",
      stat: `${rows.filter((p) => p.isActive).length} מוצגים באתר`,
      note: `${rows.filter((p) => p.stockStatus === "OUT_OF_STOCK").length} אזלו · ${rows.filter((p) => !p.isActive).length} מוסתרים`,
    },
    {
      href: "/admin/promotions",
      title: "מבצעים והנחות",
      text: "הנחה על מנה או על קטגוריה שלמה, לפי תאריכים.",
      stat: `${promos.filter((p) => promotionPhase(p, now) === "live").length} מבצעים פעילים`,
      note: `${promos.filter((p) => promotionPhase(p, now) === "scheduled").length} מתוזמנים`,
    },
    {
      href: "/admin/orders",
      title: "הזמנות",
      text: "ההזמנות לפי יום אספקה, סטטוס וסיכום יומי למטבח.",
      stat: `${open} הזמנות פתוחות`,
      note: `${hydrated ? orders.length : 0} הזמנות בסך הכול`,
    },
    {
      href: "/admin/customers",
      title: "לקוחות",
      text: "רשימת הלקוחות, ההזמנות של כל אחד, והוספת לקוח חדש.",
      stat: `${customers.length} לקוחות`,
      note: `${customers.filter((c) => c.registered).length} רשומים · ${customers.filter((c) => !c.registered).length} אורחים`,
    },
  ];

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {sections.map((s) => (
        <li key={s.href}>
          <Link href={s.href} className="flex h-full flex-col rounded-3xl bg-paper p-6 ring-1 ring-line transition hover:ring-brand-500">
            <h2 className="font-display text-xl font-bold">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.text}</p>
            <p className="mt-5 font-display text-2xl font-bold text-leaf-700">{s.stat}</p>
            <p className="text-xs text-muted">{s.note}</p>
            <span className="mt-4 text-sm font-bold text-brand-600">לניהול ←</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
