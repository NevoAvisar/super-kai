import { DEFAULT_RULES, type StoreRules } from "./config";

/**
 * Delivery-date rule (always evaluated in Israel time, whatever the server TZ):
 *   • Ordered before 14:30            → tomorrow
 *   • Ordered at/after 14:30          → the day after tomorrow
 *   • If that day is a closed day (default: Saturday), roll forward to the next
 *     open day.
 * Customers cannot choose another date — the result is the only valid date.
 */

/** A calendar date with no time/timezone, e.g. "2026-11-12". */
export type DateOnly = string;

interface ZonedNow {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
}

export function getZonedParts(now: Date, timeZone: string): ZonedNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** True if `now` is at or past the daily cut-off (14:30 Israel time by default). */
export function isPastCutoff(now: Date, rules: StoreRules = DEFAULT_RULES): boolean {
  const { hour, minute } = getZonedParts(now, rules.timeZone);
  return hour * 60 + minute >= rules.cutoffHour * 60 + rules.cutoffMinute;
}

// Pure calendar helpers on UTC-midnight dates (no DST surprises).
function toUtcDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}
function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
export function toDateOnly(date: Date): DateOnly {
  return date.toISOString().slice(0, 10);
}

export function getDeliveryDate(now: Date = new Date(), rules: StoreRules = DEFAULT_RULES): DateOnly {
  if (rules.closedWeekdays.length >= 7) throw new Error("Store has no open days configured");

  const local = getZonedParts(now, rules.timeZone);
  const today = toUtcDate(local.year, local.month, local.day);

  let date = addDays(today, isPastCutoff(now, rules) ? 2 : 1);
  while (rules.closedWeekdays.includes(date.getUTCDay())) {
    date = addDays(date, 1);
  }
  return toDateOnly(date);
}

/** Server-side check at checkout — rejects a stale date (e.g. tab left open past 14:30). */
export function isValidDeliveryDate(
  requested: DateOnly,
  now: Date = new Date(),
  rules: StoreRules = DEFAULT_RULES,
): boolean {
  return requested === getDeliveryDate(now, rules);
}

/** "יום חמישי, 12.11" */
export function formatDeliveryDateHe(date: DateOnly): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Converts a DateOnly into the Date Prisma expects for a @db.Date column. */
export function dateOnlyToDb(date: DateOnly): Date {
  return new Date(`${date}T00:00:00.000Z`);
}
