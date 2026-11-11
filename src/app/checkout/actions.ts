"use server";

import { getProducts } from "@/lib/catalog";
import { validateCheckout, type CheckoutInput, type CheckoutResult } from "@/lib/checkout";

/**
 * Step 1 of checkout: validate and price the order on the server.
 * Step 2 (next milestone) will require login, persist the Order and redirect
 * to the payment page.
 */
export async function prepareOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const catalog = await getProducts();
  return validateCheckout(input, catalog);
}
