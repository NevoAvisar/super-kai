"use server";

import { getAddressDataset } from "@/lib/il-address/service";
import { validateAddress, type AddressInput, type AddressResult } from "@/lib/il-address/validate";

/**
 * Server-side check of a customer address against the official dataset: the
 * city must exist, and the street must belong to that city. Returns the address
 * with the official names and codes — only that result may be stored.
 *
 * MOCK MODE: customers live in the browser (context/AuthContext.tsx), so the
 * client stores the verified address itself. With the database this action also
 * checks the admin session and writes the `Address` row, in the same call.
 */
export async function verifyCustomerAddress(input: AddressInput): Promise<AddressResult> {
  let dataset;
  try {
    dataset = await getAddressDataset();
  } catch {
    // Fail closed: an address that could not be verified is not saved.
    return { ok: false, errors: { city: "לא ניתן לאמת את הכתובת כרגע. נסו שוב בעוד רגע." } };
  }
  // Server actions are public endpoints — never trust the argument's shape.
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 80) : undefined);
  const code = (v: unknown) => (typeof v === "number" && Number.isInteger(v) ? v : undefined);
  return validateAddress(
    {
      cityCode: code(raw.cityCode),
      city: str(raw.city),
      streetCode: code(raw.streetCode),
      street: str(raw.street),
      houseNumber: str(raw.houseNumber),
      floor: str(raw.floor),
      entrance: str(raw.entrance),
    },
    dataset,
  );
}
