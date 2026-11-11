import { describe, expect, it } from "vitest";
import { getDeliveryDate, isPastCutoff, isValidDeliveryDate } from "./delivery-date";
import { DEFAULT_RULES } from "./config";

// Israel is UTC+2 in winter (IST) and UTC+3 in summer (IDT).
// 2026-11-11 is a Wednesday, in winter time.
const winter = (localHHMM: string, day = "2026-11-11") => {
  const [h, m] = localHHMM.split(":").map(Number);
  return new Date(Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), h - 2, m));
};

describe("cut-off at 14:30 Israel time", () => {
  it("before 14:30 → tomorrow", () => {
    expect(getDeliveryDate(winter("09:00"))).toBe("2026-11-12");
    expect(getDeliveryDate(winter("14:29"))).toBe("2026-11-12");
  });
  it("at/after 14:30 → day after tomorrow", () => {
    expect(isPastCutoff(winter("14:30"))).toBe(true);
    expect(getDeliveryDate(winter("14:30"))).toBe("2026-11-13");
    expect(getDeliveryDate(winter("23:59"))).toBe("2026-11-13");
  });
  it("uses Israel time even when the UTC date differs", () => {
    // 00:30 Israel on Nov 12 = 22:30 UTC on Nov 11
    expect(getDeliveryDate(winter("00:30", "2026-11-12"))).toBe("2026-11-13");
  });
  it("handles summer time (UTC+3)", () => {
    // 2026-07-15 14:00 IDT = 11:00 UTC → before cut-off
    expect(getDeliveryDate(new Date("2026-07-15T11:00:00Z"))).toBe("2026-07-16");
    // 14:45 IDT = 11:45 UTC → after cut-off
    expect(getDeliveryDate(new Date("2026-07-15T11:45:00Z"))).toBe("2026-07-17");
  });
});

describe("closed days (Saturday)", () => {
  it("Friday morning → skips Saturday to Sunday", () => {
    expect(getDeliveryDate(winter("10:00", "2026-11-13"))).toBe("2026-11-15");
  });
  it("Thursday after cut-off → Saturday is closed → Sunday", () => {
    expect(getDeliveryDate(winter("16:00", "2026-11-12"))).toBe("2026-11-15");
  });
  it("respects custom closed days", () => {
    const rules = { ...DEFAULT_RULES, closedWeekdays: [5, 6] }; // Fri + Sat
    expect(getDeliveryDate(winter("10:00", "2026-11-12"), rules)).toBe("2026-11-15");
  });
  it("works across month/year boundaries", () => {
    expect(getDeliveryDate(winter("15:00", "2026-12-30"))).toBe("2027-01-01");
  });
});

describe("isValidDeliveryDate", () => {
  it("rejects a date that went stale after the cut-off", () => {
    expect(isValidDeliveryDate("2026-11-12", winter("14:00"))).toBe(true);
    expect(isValidDeliveryDate("2026-11-12", winter("14:31"))).toBe(false);
  });
});
