"use client";

import { useEffect, useState } from "react";
import { DEFAULT_RULES } from "./config";
import { formatDeliveryDateHe, getDeliveryDate, getZonedParts, isPastCutoff, type DateOnly } from "./delivery-date";

export interface DeliveryInfo {
  date: DateOnly;
  label: string; // "יום חמישי, 12.11"
  pastCutoff: boolean;
  /** Minutes left until today's 14:30 cut-off (null once it has passed). */
  minutesToCutoff: number | null;
}

function compute(now = new Date()): DeliveryInfo {
  const date = getDeliveryDate(now);
  const pastCutoff = isPastCutoff(now);
  const { hour, minute } = getZonedParts(now, DEFAULT_RULES.timeZone);
  const left = DEFAULT_RULES.cutoffHour * 60 + DEFAULT_RULES.cutoffMinute - (hour * 60 + minute);
  return { date, label: formatDeliveryDateHe(date), pastCutoff, minutesToCutoff: pastCutoff ? null : left };
}

/**
 * Live delivery date (Israel time). Re-evaluated every 30 s, so a page left
 * open across 14:30 updates by itself. null during SSR / first render.
 */
export function useDeliveryDate(): DeliveryInfo | null {
  const [info, setInfo] = useState<DeliveryInfo | null>(null);
  useEffect(() => {
    setInfo(compute());
    const id = setInterval(() => setInfo(compute()), 30_000);
    return () => clearInterval(id);
  }, []);
  return info;
}

export function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")} שעות` : `${m} דקות`;
}
