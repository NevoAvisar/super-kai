"use server";

import { getProducts } from "@/lib/catalog";
import { validateCheckout, type CheckoutInput, type CheckoutResult } from "@/lib/checkout";
import { applyLocalAdmin, type LocalAdminData } from "@/lib/local-admin";

/**
 * Validate and price the order on the server.
 *
 * MOCK MODE ONLY: the admin's edits live in the browser (lib/local-admin.ts), so
 * the client sends them along and the order is priced from the catalog the
 * customer actually saw. That data is not trustworthy — with a database the
 * `local` argument goes away, the catalog is read from the DB, and this action
 * also requires a session, persists the Order and redirects to payment.
 */
export async function prepareOrder(input: CheckoutInput, local?: LocalAdminData): Promise<CheckoutResult> {
  const base = await getProducts();
  const catalog = local && process.env.CATALOG_SOURCE !== "db" ? applyLocalAdmin(base, local) : base;
  return validateCheckout(input, catalog);
}
