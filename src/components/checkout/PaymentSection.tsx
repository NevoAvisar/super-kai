"use client";

import { Check, CreditCard, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { cardBrand, demoCard, formatCardNumber, formatExpiry, type CardDraft, type CardErrors } from "@/lib/demo-payment";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/local-admin";

/**
 * The checkout's payment step — DEMO ONLY (see lib/demo-payment.ts). The wallet
 * buttons and the card form look and behave like the real thing, but nothing is
 * charged and nothing leaves the browser.
 */

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const WALLET_FONT = { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Google Sans", Roboto, "Helvetica Neue", Arial, sans-serif' };
const WALLET_BASE =
  "flex h-13 w-full items-center justify-center gap-1.5 rounded-xl text-[1.375rem] font-medium leading-none transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40";

export function DemoModeBadge() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-leaf-50 px-3 py-1 text-xs font-medium text-leaf-700 ring-1 ring-leaf-600/20">
      <ShieldCheck className="size-3.5" aria-hidden />
      מצב הדגמה – לא יתבצע חיוב אמיתי
    </p>
  );
}

function CardField({ id, label, value, onChange, error, placeholder, autoComplete, maxLength, className = "", adornment }: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; placeholder: string;
  autoComplete: string; maxLength: number; className?: string; adornment?: React.ReactNode;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="relative block">
        <input
          id={id}
          dir="ltr"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          className={`w-full rounded-xl bg-paper px-4 py-2.5 text-left tabular-nums tracking-wide ring-1 outline-none placeholder:text-muted/50 focus:ring-2 focus:ring-brand-500 ${error ? "ring-brand-600" : "ring-line"}`}
        />
        {adornment && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-muted">{adornment}</span>}
      </span>
      {error && <span className="text-xs text-brand-700">{error}</span>}
    </label>
  );
}

export function PaymentSection({ step, totalLabel, card, onCardChange, errors, disabled, busy, onWallet }: {
  step: number;
  totalLabel: string;
  card: CardDraft;
  onCardChange: (card: CardDraft) => void;
  errors: CardErrors;
  /** Nothing to pay for yet (empty cart, below the minimum, no delivery date). */
  disabled: boolean;
  /** A payment is being validated or processed. */
  busy: boolean;
  onWallet: (method: Exclude<PaymentMethod, "CARD">) => void;
}) {
  const off = disabled || busy;
  const set = (k: keyof CardDraft, format: (v: string) => string = (v) => v) => (v: string) => onCardChange({ ...card, [k]: format(v) });
  const brand = cardBrand(card.number);

  return (
    <section className="space-y-5 rounded-3xl bg-paper p-6 ring-1 ring-line" aria-labelledby="payment-title">
      <div className="space-y-3">
        <DemoModeBadge />
        <h2 id="payment-title" className="font-display text-2xl font-bold">{step}. תשלום</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2" dir="ltr">
        <button
          type="button"
          disabled={off}
          onClick={() => onWallet("APPLE_PAY")}
          aria-label={`תשלום באמצעות ${PAYMENT_METHOD_LABEL.APPLE_PAY}`}
          style={WALLET_FONT}
          className={`${WALLET_BASE} bg-black text-white hover:bg-neutral-800`}
        >
          <AppleLogo className="-mt-1 size-[1.35rem]" />
          <span>Pay</span>
        </button>
        <button
          type="button"
          disabled={off}
          onClick={() => onWallet("GOOGLE_PAY")}
          aria-label={`תשלום באמצעות ${PAYMENT_METHOD_LABEL.GOOGLE_PAY}`}
          style={WALLET_FONT}
          className={`${WALLET_BASE} bg-white text-[#3c4043] ring-1 ring-[#dadce0] hover:bg-[#f8f9fa] hover:ring-[#c6c9ce]`}
        >
          <GoogleLogo className="size-[1.3rem]" />
          <span>Pay</span>
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted" role="separator">
        <span className="h-px flex-1 bg-line" />
        או בכרטיס אשראי
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-4 rounded-2xl bg-cream/70 p-4 ring-1 ring-line sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold">
            <CreditCard className="size-4.5 text-brand-500" aria-hidden />
            פרטי כרטיס
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onCardChange(demoCard())}
            className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-brand-600 ring-1 ring-brand-100 transition hover:bg-brand-50 disabled:opacity-50"
          >
            <Sparkles className="size-3.5" aria-hidden />
            מילוי פרטי דמה
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <CardField
            id="cardNumber" label="מספר כרטיס" className="col-span-2 sm:col-span-4"
            value={card.number} onChange={set("number", formatCardNumber)} error={errors.cardNumber}
            placeholder="0000 0000 0000 0000" autoComplete="cc-number" maxLength={23} adornment={brand}
          />
          <CardField
            id="cardExpiry" label="תוקף" value={card.expiry} onChange={set("expiry", formatExpiry)} error={errors.cardExpiry}
            placeholder="MM/YY" autoComplete="cc-exp" maxLength={5}
          />
          <CardField
            id="cardCvv" label="CVV" value={card.cvv} onChange={set("cvv", (v) => v.replace(/\D/g, ""))} error={errors.cardCvv}
            placeholder="123" autoComplete="cc-csc" maxLength={4}
          />
          <CardField
            id="cardId" label="תעודת זהות של בעל/ת הכרטיס" className="col-span-2"
            value={card.idNumber} onChange={set("idNumber", (v) => v.replace(/\D/g, ""))} error={errors.cardId}
            placeholder="9 ספרות" autoComplete="off" maxLength={9}
          />
        </div>

        <button
          type="submit"
          disabled={off}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-bold text-paper transition hover:bg-brand-500 disabled:bg-line"
        >
          <Lock className="size-4" aria-hidden />
          {busy ? "רגע…" : `תשלום ${totalLabel}`}
        </button>
      </div>

      <p className="text-center text-xs text-muted">פרטי הכרטיס נבדקים בדפדפן בלבד, אינם נשלחים לשום שרת ואינם נשמרים.</p>
    </section>
  );
}

/** Full-screen "processing → approved" sheet shown while the demo payment runs. */
export function PaymentOverlay({ phase, method, totalLabel }: { phase: "processing" | "success"; method: PaymentMethod; totalLabel: string }) {
  const done = phase === "success";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pay-status">
      <div className="pay-pop w-full max-w-xs space-y-4 rounded-3xl bg-paper p-8 text-center shadow-2xl ring-1 ring-line">
        <div className="mx-auto grid size-16 place-items-center">
          {done ? (
            <span className="pay-pop grid size-16 place-items-center rounded-full bg-leaf-600 text-white">
              <Check className="size-8" strokeWidth={3} aria-hidden />
            </span>
          ) : (
            <span className="size-14 animate-spin rounded-full border-4 border-line border-t-brand-500 motion-reduce:animate-none" aria-hidden />
          )}
        </div>
        <div className="space-y-1" role="status" aria-live="polite">
          <p id="pay-status" className="font-display text-2xl font-bold">{done ? "התשלום אושר" : "מעבד תשלום..."}</p>
          <p className="text-sm text-muted">
            {PAYMENT_METHOD_LABEL[method]} · <span className="font-bold text-ink tabular-nums">{totalLabel}</span>
          </p>
        </div>
        <p className="text-xs text-muted">מצב הדגמה – לא יתבצע חיוב אמיתי</p>
      </div>
    </div>
  );
}
