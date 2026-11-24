import { DEFAULT_RULES } from "./config";

/**
 * Public contact details. The phone number is a placeholder until Kai's real
 * ordering line is set up — change it here and it updates everywhere.
 */
export const CONTACT = {
  phoneDisplay: "050-000-0000",
  /** E.164 form for tel: links. */
  phoneHref: "tel:+972500000000",
  email: "hello@super-kai.co.il",
  phoneHours: [
    { days: "ראשון–חמישי", hours: "08:00–18:00" },
    { days: "שישי וערבי חג", hours: "08:00–13:00" },
    { days: "שבת", hours: "סגור" },
  ],
  cutoff: `${DEFAULT_RULES.cutoffHour}:${String(DEFAULT_RULES.cutoffMinute).padStart(2, "0")}`,
};
