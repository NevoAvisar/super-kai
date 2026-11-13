import { getProducts } from "@/lib/catalog";
import { AdminOverview } from "@/components/admin/AdminOverview";

/** Admin landing page: a count and a link for each management screen. */
export default async function AdminPage() {
  return <AdminOverview products={await getProducts()} />;
}
