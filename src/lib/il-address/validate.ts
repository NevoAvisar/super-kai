import { findCity, LOCALITY_STREET_CODE, streetsOf, type AddressDataset } from "./dataset";

/** A verified customer address — the shape stored on the customer (prisma `Address`). */
export interface CustomerAddress {
  cityCode: number;
  city: string;
  /** LOCALITY_STREET_CODE (9000) when the locality has no street names; `street` is then the locality name. */
  streetCode: number;
  street: string;
  houseNumber: string;
  floor?: string;
  entrance?: string;
}

/** What a form submits. Codes come from the dropdown selection; the names must agree with them. */
export interface AddressInput {
  cityCode?: number | null;
  city?: string;
  streetCode?: number | null;
  street?: string;
  houseNumber?: string;
  floor?: string;
  entrance?: string;
}

export type AddressField = "city" | "street" | "houseNumber" | "floor" | "entrance";
export type AddressErrors = Partial<Record<AddressField, string>>;
export type AddressResult = { ok: true; address: CustomerAddress } | { ok: false; errors: AddressErrors };

const text = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

/** "12", "12א", "12B", "12/3". */
const HOUSE_NUMBER = /^\d{1,4}[א-תA-Za-z]?(\/\d{1,3})?$/;
/** A number ("3", "-1") or a short word ("קרקע", "מרתף", "גג"). */
const FLOOR = /^(-?\d{1,2}|[א-ת][א-ת"״'׳ ]{0,11})$/;
/** "א", "ב", "B", "2". */
const ENTRANCE = /^[א-תA-Za-z0-9]{1,3}$/;

/** The free-text fields: the same rules in the form and on the server. */
export function detailErrors(input: Pick<AddressInput, "houseNumber" | "floor" | "entrance">): AddressErrors {
  const errors: AddressErrors = {};
  const houseNumber = text(input.houseNumber);
  const floor = text(input.floor);
  const entrance = text(input.entrance);
  if (!houseNumber) errors.houseNumber = "נא למלא מספר בית.";
  else if (!HOUSE_NUMBER.test(houseNumber)) errors.houseNumber = "מספר בית לא תקין (לדוגמה: 12 או 12א).";
  if (floor && !FLOOR.test(floor)) errors.floor = "קומה לא תקינה (לדוגמה: 3 או קרקע).";
  if (entrance && !ENTRANCE.test(entrance)) errors.entrance = "כניסה לא תקינה (לדוגמה: א).";
  return errors;
}

/**
 * The authoritative check: the city must be an official locality, and the
 * street must be an official street of that very city. Returns the address with
 * the official names and codes, so what gets stored never depends on the
 * spelling that was submitted.
 */
export function validateAddress(input: AddressInput, dataset: AddressDataset): AddressResult {
  const errors: AddressErrors = detailErrors(input);

  const cityName = text(input.city);
  const city =
    typeof input.cityCode === "number"
      ? findCity(dataset, input.cityCode)
      : dataset.cities.find((c) => c.name === cityName);
  let street: { code: number; name: string } | undefined;

  if (!cityName && typeof input.cityCode !== "number") {
    errors.city = "נא לבחור עיר.";
  } else if (!city || (cityName && cityName !== city.name)) {
    errors.city = "העיר לא נמצאה ברשימת היישובים הרשמית. יש לבחור עיר מהרשימה.";
  } else {
    const streets = streetsOf(dataset, city.code);
    const streetName = text(input.street);
    const hasCode = typeof input.streetCode === "number";
    if (!streets.length) {
      // A kibbutz or village with no street names: the locality itself is the "street".
      const isPlaceholder = (!hasCode || input.streetCode === LOCALITY_STREET_CODE) && (!streetName || streetName === city.name);
      if (isPlaceholder) street = { code: LOCALITY_STREET_CODE, name: city.name };
      else errors.street = `ביישוב ${city.name} אין שמות רחובות רשמיים. יש להשאיר את שדה הרחוב ריק.`;
    } else if (!streetName && !hasCode) {
      errors.street = "נא לבחור רחוב.";
    } else {
      street = hasCode ? streets.find((s) => s.code === input.streetCode) : streets.find((s) => s.name === streetName);
      if (!street || (streetName && streetName !== street.name)) {
        street = undefined;
        errors.street = `הרחוב לא נמצא ברשימת הרחובות הרשמית של ${city.name}. יש לבחור רחוב מהרשימה.`;
      }
    }
  }

  if (!city || !street || Object.keys(errors).length) return { ok: false, errors };
  const floor = text(input.floor);
  const entrance = text(input.entrance);
  return {
    ok: true,
    address: {
      cityCode: city.code,
      city: city.name,
      streetCode: street.code,
      street: street.name,
      houseNumber: text(input.houseNumber),
      ...(floor && { floor }),
      ...(entrance && { entrance }),
    },
  };
}

/** "הרצל 12, כניסה ב, קומה 3, חולון" — or "12, אפיקים" where there are no street names. */
export function formatAddress(a: CustomerAddress): string {
  const first = a.streetCode === LOCALITY_STREET_CODE ? `בית ${a.houseNumber}` : `${a.street} ${a.houseNumber}`;
  return [first, a.entrance && `כניסה ${a.entrance}`, a.floor && `קומה ${a.floor}`, a.city].filter(Boolean).join(", ");
}
