import { describe, expect, it } from "vitest";
import { buildDataset, searchKey, streetsOf } from "./dataset";
import { formatAddress, validateAddress } from "./validate";

const row = (cityCode: number, city: string, streetCode: number, street: string) => ({
  סמל_ישוב: cityCode,
  שם_ישוב: `${city} `, // the source pads names
  סמל_רחוב: streetCode,
  שם_רחוב: `${street}  `,
});

const dataset = buildDataset(
  [
    row(5000, "תל אביב - יפו", 9000, "תל אביב - יפו"),
    row(5000, "תל אביב - יפו", 2215, "הרצל"),
    row(5000, "תל אביב - יפו", 404, "דיזנגוף"),
    row(6600, "חולון", 9000, "חולון"),
    row(6600, "חולון", 710, "סוקולוב"),
    row(176, "אפיקים", 9000, "אפיקים"),
  ],
  "2026-11-15T00:00:00.000Z",
);

describe("buildDataset", () => {
  it("trims names, sorts, and keeps the locality placeholder out of the street lists", () => {
    expect(dataset.cities.map((c) => c.name)).toEqual(["אפיקים", "חולון", "תל אביב - יפו"]);
    expect(streetsOf(dataset, 5000)).toEqual([{ code: 404, name: "דיזנגוף" }, { code: 2215, name: "הרצל" }]);
    expect(streetsOf(dataset, 176)).toEqual([]);
  });
});

describe("searchKey", () => {
  it("ignores punctuation and spelling variants", () => {
    expect(searchKey("תל אביב - יפו")).toContain(searchKey("תל-אביב"));
    expect(searchKey("קריית אונו")).toBe(searchKey("קרית אונו"));
    expect(searchKey("ז'בוטינסקי")).toBe(searchKey("ז׳בוטינסקי"));
  });
});

describe("validateAddress", () => {
  const ok = { cityCode: 5000, city: "תל אביב - יפו", streetCode: 2215, street: "הרצל", houseNumber: "12א", floor: "3", entrance: "ב" };

  it("accepts an official city + street and returns the canonical address", () => {
    expect(validateAddress(ok, dataset)).toEqual({ ok: true, address: ok });
    // By name only (no codes), with stray spaces; optional fields dropped.
    expect(validateAddress({ city: " חולון ", street: "סוקולוב", houseNumber: "7" }, dataset)).toEqual({
      ok: true,
      address: { cityCode: 6600, city: "חולון", streetCode: 710, street: "סוקולוב", houseNumber: "7" },
    });
  });

  it("blocks a city that is not an official locality", () => {
    for (const input of [{ ...ok, cityCode: undefined, city: "עיר הקסמים" }, { ...ok, cityCode: 123456 }, { ...ok, city: "תל אביב" }]) {
      const r = validateAddress(input, dataset);
      expect(r.ok).toBe(false);
      expect(!r.ok && r.errors.city).toBeTruthy();
    }
    expect(validateAddress({ houseNumber: "1" }, dataset)).toMatchObject({ ok: false, errors: { city: "נא לבחור עיר." } });
  });

  it("blocks a street that does not belong to the chosen city", () => {
    // סוקולוב exists in חולון, not in this dataset's תל אביב.
    for (const input of [
      { ...ok, streetCode: 710, street: "סוקולוב" },
      { ...ok, streetCode: undefined, street: "סוקולוב" },
      { ...ok, street: "רחוב מומצא" },
      { ...ok, streetCode: 9000, street: "תל אביב - יפו" },
    ]) {
      const r = validateAddress(input, dataset);
      expect(r.ok).toBe(false);
      expect(!r.ok && r.errors.street).toBeTruthy();
    }
    expect(validateAddress({ ...ok, streetCode: undefined, street: "" }, dataset)).toMatchObject({ ok: false, errors: { street: "נא לבחור רחוב." } });
  });

  it("handles a locality with no street names", () => {
    const r = validateAddress({ cityCode: 176, city: "אפיקים", houseNumber: "45" }, dataset);
    expect(r).toEqual({ ok: true, address: { cityCode: 176, city: "אפיקים", streetCode: 9000, street: "אפיקים", houseNumber: "45" } });
    expect(r.ok && formatAddress(r.address)).toBe("בית 45, אפיקים");
    expect(validateAddress({ cityCode: 176, city: "אפיקים", street: "הרצל", houseNumber: "45" }, dataset).ok).toBe(false);
  });

  it("validates house number, floor and entrance", () => {
    expect(validateAddress({ ...ok, houseNumber: "" }, dataset)).toMatchObject({ ok: false, errors: { houseNumber: "נא למלא מספר בית." } });
    for (const houseNumber of ["אבג", "12345", "12 א ב", "<b>"]) expect(validateAddress({ ...ok, houseNumber }, dataset).ok).toBe(false);
    for (const houseNumber of ["12", "12א", "12B", "12/3"]) expect(validateAddress({ ...ok, houseNumber }, dataset).ok).toBe(true);
    for (const floor of ["קרקע", "-1", "12", ""]) expect(validateAddress({ ...ok, floor }, dataset).ok).toBe(true);
    expect(validateAddress({ ...ok, floor: "קומה מאוד גבוהה מאוד" }, dataset)).toMatchObject({ ok: false, errors: { floor: expect.any(String) } });
    expect(validateAddress({ ...ok, entrance: "אבגד" }, dataset)).toMatchObject({ ok: false, errors: { entrance: expect.any(String) } });
  });

  it("formats an address for display", () => {
    expect(formatAddress(ok)).toBe("הרצל 12א, כניסה ב, קומה 3, תל אביב - יפו");
  });
});
