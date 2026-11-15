import { formatDeliveryDateHe, type DateOnly } from "./delivery-date";
import { ORDER_STATUS_LABEL, type LocalOrder } from "./local-admin";
import { formatILS } from "./money";
import { formatQuantity, type SaleUnit } from "./quantity";

/**
 * Notification messages (Email / WhatsApp) — pure builders, unit-tested.
 *
 * EN: QA found the NotificationLog model and the "new order → Email + WhatsApp"
 *     requirement had no code at all. Until a provider (WhatsApp Cloud API,
 *     Resend/SES…) and a server job exist, the admin sends these with one tap:
 *     wa.me / mailto links pre-filled with these texts. The same builders will
 *     be reused by the server sender, which also writes NotificationLog rows.
 * HE: לא היה שום קוד להתראות. עד לחיבור ספק (WhatsApp API / שירות מייל) קאי
 *     שולח בלחיצה אחת קישור wa.me / mailto עם הודעה מוכנה. אותן פונקציות ישמשו
 *     גם את השליחה האוטומטית מהשרת בהמשך.
 */

/** Israeli local number → E.164 digits for wa.me ("050-1234567" → "972501234567"). null if not Israeli/valid. */
export function toWhatsAppNumber(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (/^0\d{8,9}$/.test(digits)) return `972${digits.slice(1)}`;
  if (/^972\d{8,9}$/.test(digits)) return digits;
  return null;
}

export function whatsAppLink(phone: string | null, text: string): string {
  const to = phone ? toWhatsAppNumber(phone) : null;
  return `https://wa.me/${to ?? ""}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(email.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const lineText = (l: { name: string; quantity: number; saleUnit: SaleUnit }) => `• ${l.name} – ${formatQuantity(l.quantity, l.saleUnit)}`;

/** Order update for the customer (status, date, lines, total). */
export function customerOrderMessage(o: LocalOrder): string {
  const when = `${o.fulfillment === "DELIVERY" ? "אספקה" : "איסוף עצמי"} ב${formatDeliveryDateHe(o.deliveryDate)}`;
  return [
    `שלום ${o.contact.name.split(" ")[0]}, כאן קאי מסופר-קאי 👋`,
    `הזמנה ${o.orderNumber}: ${ORDER_STATUS_LABEL[o.status]}.`,
    when + ".",
    ...o.lines.map(lineText),
    `סה״כ: ${formatILS(o.totals.totalAgorot)}`,
    "תודה שהזמנתם!",
  ].join("\n");
}

/** New-order alert for Kai. */
export function newOrderAdminMessage(o: LocalOrder): string {
  return [
    `🛎️ הזמנה חדשה ${o.orderNumber} – ${formatILS(o.totals.totalAgorot)}`,
    `${o.contact.name} · ${o.contact.phone}`,
    o.address ? `🚚 ${o.address.street} ${o.address.houseNumber}, ${o.address.city}` : "🏠 איסוף עצמי",
    `📅 ${formatDeliveryDateHe(o.deliveryDate)}`,
    ...o.lines.map(lineText),
  ].join("\n");
}

/** Morning summary for a delivery date: counts, revenue and kitchen totals per dish. */
export function dailySummaryMessage(orders: LocalOrder[], date: DateOnly): string {
  const live = orders.filter((o) => o.deliveryDate === date && o.status !== "CANCELLED");
  const cancelled = orders.filter((o) => o.deliveryDate === date && o.status === "CANCELLED").length;
  const revenue = live.reduce((n, o) => n + o.totals.totalAgorot, 0);
  const deliveries = live.filter((o) => o.fulfillment === "DELIVERY").length;

  const dishes = new Map<string, { name: string; saleUnit: SaleUnit; quantity: number }>();
  for (const o of live) {
    for (const l of o.lines) {
      const row = dishes.get(l.productId) ?? { name: l.name, saleUnit: l.saleUnit, quantity: 0 };
      row.quantity = Math.round((row.quantity + l.quantity) * 100) / 100; // 0.25 kg steps stay exact
      dishes.set(l.productId, row);
    }
  }
  const kitchen = [...dishes.values()].sort((a, b) => a.name.localeCompare(b.name, "he")).map(lineText);

  return [
    `📋 סיכום יומי – ${formatDeliveryDateHe(date)}`,
    `${live.length} הזמנות · ${formatILS(revenue)}`,
    `🚚 ${deliveries} משלוחים · 🏠 ${live.length - deliveries} איסופים${cancelled ? ` · ${cancelled} בוטלו` : ""}`,
    ...(kitchen.length ? ["", "להכנה במטבח:", ...kitchen] : ["", "אין הזמנות ליום הזה."]),
  ].join("\n");
}
