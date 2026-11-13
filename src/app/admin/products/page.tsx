import { getCategories, getProducts } from "@/lib/catalog";
import { ProductsManager } from "@/components/admin/ProductsManager";

export default async function AdminProductsPage() {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);
  return <ProductsManager categories={categories} products={products} />;
}
