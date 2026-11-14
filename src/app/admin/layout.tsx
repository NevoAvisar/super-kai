import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "ניהול אתר", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The shell needs real dishes and prices to build the sample orders.
  const products = (await getProducts())
    .filter((p) => p.inStock)
    .map((p) => ({ id: p.id, name: p.name, saleUnit: p.saleUnit, priceAgorot: p.priceAgorot, listPriceAgorot: p.listPriceAgorot }));
  return <AdminShell products={products}>{children}</AdminShell>;
}
