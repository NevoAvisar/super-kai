"use server";

import { getProducts } from "@/lib/catalog";
import { normalizeCheckoutInput, validateCheckout, type CheckoutInput, type CheckoutResult } from "@/lib/checkout";
import { getAddressDataset } from "@/lib/il-address/service";
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
export async function prepareOrder(rawInput: CheckoutInput, local?: LocalAdminData): Promise<CheckoutResult> {
  // QA: never trust the runtime shape of a Server Action argument (malformed input used to crash with a 500).
  // HE: לא סומכים על מבנה הקלט של פעולת שרת – קלט שבור גרם בעבר לשגיאת 500.
  const input = normalizeCheckoutInput(rawInput);
  const base = await getProducts();
  // QA: in DB mode the browser-supplied overlay is ignored entirely (it is untrusted).
  const catalog = local && process.env.CATALOG_SOURCE !== "db" ? applyLocalAdmin(base, sanitizeLocal(local)) : base;
  let addresses;
  try {
    addresses = await getAddressDataset();
  } catch {
    // Fail closed: a delivery address that cannot be verified is not accepted.
    addresses = { fetchedAt: "", cities: [], streets: {} };
  }
  const result = validateCheckout(input, catalog, addresses);
  if (!result.ok && !addresses.cities.length && input.fulfillment === "DELIVERY") {
    result.errors.city = "לא ניתן לאמת את הכתובת כרגע. נסו שוב בעוד רגע.";
    delete result.errors.street;
  }
  return result;
}

/** Drops a malformed overlay instead of crashing on it (mock mode only). */
function sanitizeLocal(local: LocalAdminData): LocalAdminData {
  const ok = local && typeof local === "object" && local.overrides && typeof local.overrides === "object"
    && Array.isArray(local.added) && Array.isArray(local.promotions);
  return ok ? local : { overrides: {}, added: [], promotions: [] };
}
