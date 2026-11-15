/**
 * Official Israeli localities and streets — the shapes shared by the server
 * service, the validation and the admin form.
 *
 * Source: data.gov.il, "רשימת רחובות בישראל" (Population Authority), which
 * lists every street of every locality with the official CBS codes.
 */

export interface City {
  /** סמל יישוב (CBS locality code). */
  code: number;
  name: string;
}

export interface Street {
  /** סמל רחוב — unique inside its city. */
  code: number;
  name: string;
}

/** Compact, JSON-friendly form: what the snapshot file and the cache hold. */
export interface AddressDataset {
  /** ISO time the data was read from data.gov.il. */
  fetchedAt: string;
  cities: City[];
  /** City code → that city's streets as [code, name] pairs (without the locality placeholder row). */
  streets: Record<string, [code: number, name: string][]>;
}

/**
 * Every locality has one row whose "street" is the locality itself (code 9000).
 * A kibbutz or small village with no street names has only that row, so it is
 * kept out of the street lists and used as the stored street for such places.
 */
export const LOCALITY_STREET_CODE = 9000;

export const findCity = (dataset: AddressDataset, code: number): City | undefined => dataset.cities.find((c) => c.code === code);

/** A city's selectable streets; empty for a locality that has no street names. */
export const streetsOf = (dataset: AddressDataset, cityCode: number): Street[] =>
  (dataset.streets[String(cityCode)] ?? []).map(([code, name]) => ({ code, name }));

export const CKAN_URL = "https://data.gov.il/api/3/action/datastore_search";
export const STREETS_RESOURCE_ID = "9ad3862c-8391-4b2f-84a4-2d4c68625f4b";

const clean = (text: unknown) => String(text ?? "").replace(/\s+/g, " ").trim();

/**
 * Text as people type it → a key for matching: no quotes, hyphens, brackets or
 * double spaces, so "תל אביב" finds "תל אביב - יפו" and "קרית" finds "קריית".
 */
export function searchKey(text: string): string {
  return clean(text)
    .replace(/["״'׳`*().,]/g, "")
    .replace(/[-־–/]/g, " ")
    .replace(/יי/g, "י")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

interface StreetRow {
  סמל_ישוב: number | string;
  שם_ישוב: string;
  סמל_רחוב: number | string;
  שם_רחוב: string;
}

/** Turn the raw CKAN rows into the compact dataset (sorted for the dropdowns). */
export function buildDataset(rows: StreetRow[], fetchedAt: string): AddressDataset {
  const cities = new Map<number, string>();
  const streets = new Map<number, Map<number, string>>();
  for (const row of rows) {
    const cityCode = Number(row.סמל_ישוב);
    const cityName = clean(row.שם_ישוב);
    const streetCode = Number(row.סמל_רחוב);
    const streetName = clean(row.שם_רחוב);
    if (!Number.isInteger(cityCode) || cityCode <= 0 || !cityName) continue;
    cities.set(cityCode, cityName);
    if (!Number.isInteger(streetCode) || !streetName) continue;
    if (streetCode === LOCALITY_STREET_CODE || streetName === cityName) continue;
    let list = streets.get(cityCode);
    if (!list) streets.set(cityCode, (list = new Map()));
    list.set(streetCode, streetName);
  }
  return {
    fetchedAt,
    cities: [...cities].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name, "he")),
    streets: Object.fromEntries(
      [...streets].map(([code, list]) => [String(code), [...list].sort((a, b) => a[1].localeCompare(b[1], "he"))]),
    ),
  };
}

/**
 * Read the whole streets resource from data.gov.il (about 64k rows, paged).
 * Throws when the API is unreachable or answers with something unexpected, so
 * callers can keep the data they already have.
 */
export async function fetchOfficialDataset(fetchImpl: typeof fetch = fetch, pageSize = 32000): Promise<AddressDataset> {
  const rows: StreetRow[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = `${CKAN_URL}?resource_id=${STREETS_RESOURCE_ID}&limit=${pageSize}&offset=${offset}`;
    const res = await fetchImpl(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`data.gov.il answered ${res.status}`);
    const body = (await res.json()) as { success?: boolean; result?: { records?: StreetRow[]; total?: number } };
    const page = body.result?.records;
    if (!body.success || !Array.isArray(page)) throw new Error("data.gov.il returned an unexpected response");
    rows.push(...page);
    if (page.length < pageSize || rows.length >= (body.result?.total ?? Infinity)) break;
  }
  const dataset = buildDataset(rows, new Date().toISOString());
  // A truncated or empty answer must never replace good data.
  if (dataset.cities.length < 1000 || Object.keys(dataset.streets).length < 500) {
    throw new Error(`data.gov.il returned a partial dataset (${dataset.cities.length} localities)`);
  }
  return dataset;
}
