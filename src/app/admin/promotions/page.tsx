import { getCategories, getProducts } from "@/lib/catalog";
import { PromotionsManager } from "@/components/admin/PromotionsManager";

export default async function AdminPromotionsPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return <PromotionsManager categories={categories} products={products} />;
}
