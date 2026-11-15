import type { OrderPayment, PaymentMethod } from "./local-admin";

/**
 * DEMO PAYMENT — there is no payment provider yet. Nothing here talks to a
 * network: the card fields are checked in the browser, a short "processing"
 * pause is shown, and the order is saved as paid in demo mode. Only the last
 * four digits of a card are ever kept. A real provider (hosted fields / wallet
 * tokens) replaces `demoPayment` and the pause; the UI stays.
 */

export interface CardDraft {
  number: string;
  expiry: string;
  cvv: string;
  idNumber: string;
}

export const EMPTY_CARD: CardDraft = { number: "", expiry: "", cvv: "", idNumber: "" };

export type CardErrors = Partial<Record<"cardNumber" | "cardExpiry" | "cardCvv" | "cardId", string>>;

const digits = (s: string) => s.replace(/\D/g, "");

/** "4111111111111111" → "4111 1111 1111 1111" */
export function formatCardNumber(raw: string): string {
  return digits(raw).slice(0, 19).replace(/(.{4})(?=.)/g, "$1 ");
}

/** "1229" → "12/29" */
export function formatExpiry(raw: string): string {
  const d = digits(raw).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function cardBrand(number: string): string | null {
  const d = digits(number);
  if (/^4/.test(d)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^(36|30[0-5])/.test(d)) return "Diners";
  return null;
}

export function passesLuhn(number: string): boolean {
  const d = digits(number);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

/** Israeli ID number: up to 9 digits with the official check digit. */
export function isValidIsraeliId(raw: string): boolean {
  const d = digits(raw);
  if (d.length < 5 || d.length > 9 || d !== raw.trim() || /^0+$/.test(d)) return false;
  const padded = d.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const n = Number(padded[i]) * ((i % 2) + 1);
    sum += n > 9 ? n - 9 : n;
  }
  return sum % 10 === 0;
}

export function validateCard(card: CardDraft, now: Date = new Date()): CardErrors {
  const errors: CardErrors = {};
  if (!passesLuhn(card.number)) errors.cardNumber = "מספר הכרטיס אינו תקין.";

  const m = /^(\d{2})\/(\d{2})$/.exec(card.expiry.trim());
  const month = m ? Number(m[1]) : 0;
  const year = m ? 2000 + Number(m[2]) : 0;
  if (!m || month < 1 || month > 12) errors.cardExpiry = "תוקף בפורמט MM/YY.";
  else if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) errors.cardExpiry = "תוקף הכרטיס פג.";

  if (!/^\d{3,4}$/.test(card.cvv.trim())) errors.cardCvv = "3 או 4 ספרות.";
  if (!isValidIsraeliId(card.idNumber)) errors.cardId = "מספר תעודת זהות אינו תקין.";
  return errors;
}

/** A well-known test card and test ID — both pass the checks above, neither is real. */
export function demoCard(now: Date = new Date()): CardDraft {
  return {
    number: "4111 1111 1111 1111",
    expiry: `12/${String((now.getFullYear() + 3) % 100).padStart(2, "0")}`,
    cvv: "123",
    idNumber: "123456782",
  };
}

/** The payment record stored on the order. The card number itself is never kept. */
export function demoPayment(method: PaymentMethod, card?: CardDraft, now: Date = new Date()): OrderPayment {
  const reference = `DEMO-${now.getTime().toString(36).toUpperCase()}`;
  return {
    method,
    status: "PAID_DEMO",
    reference,
    paidAt: now.toISOString(),
    ...(method === "CARD" && card && { last4: digits(card.number).slice(-4) }),
  };
}
