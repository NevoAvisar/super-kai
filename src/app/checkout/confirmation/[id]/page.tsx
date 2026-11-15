"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { OrderLines, PaymentBadge } from "@/components/OrderCard";
import { useAuth } from "@/context/AuthContext";
import { formatDeliveryDateHe } from "@/lib/delivery-date";
import { formatAddress } from "@/lib/il-address/validate";
import { paymentText } from "@/lib/local-admin";
import { useHydrated } from "@/lib/use-hydrated";
import { useOrdersStore } from "@/store/admin";

/**
 * Order confirmation, reached from the checkout's demo payment step.
 * MOCK: the order is read from this browser's store (store/admin.ts); with a
 * database this becomes a server page that loads the signed-in user's order.
 */
export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const hydrated = useHydrated();
  const { user } = useAuth();
  const order = useOrdersStore((s) => s.orders.find((o) => o.id === id));

  if (!hydrated) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">טוען…</div>;

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">לא מצאנו את ההזמנה הזו</h1>
        <p className="text-muted">בגרסת ההדגמה הזמנות נשמרות רק בדפדפן שבו בוצעו.</p>
        <Link href="/catalog" className="inline-block rounded-full bg-ink px-7 py-3 font-bold text-paper hover:bg-brand-500">
          לתפריט המלא
        </Link>
      </div>
    );
  }

  const delivery = order.fulfillment === "DELIVERY";
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-14">
      <div className="space-y-3 text-center">
        <span className="pay-pop mx-auto grid size-16 place-items-center rounded-full bg-leaf-600 text-white">
          <Check className="size-8" strokeWidth={3} aria-hidden />
        </span>
        <h1 className="font-display text-4xl font-bold">תודה, ההזמנה התקבלה!</h1>
        <p className="text-muted">ההזמנה רשומה על שם {order.contact.name} · <span dir="ltr">{order.contact.email}</span></p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-paper p-5 ring-1 ring-line">
          <p className="text-xs text-muted">מספר הזמנה</p>
          <p className="font-display text-3xl font-bold tabular-nums">{order.orderNumber}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PaymentBadge payment={order.payment} />
          </div>
          {order.payment && <p className="mt-2 text-xs text-muted">{paymentText(order.payment)} · אסמכתה <span dir="ltr" className="whitespace-nowrap">{order.payment.reference}</span></p>}
        </div>
        <div className="rounded-3xl bg-leaf-50 p-5 text-leaf-700 ring-1 ring-leaf-600/15">
          <p className="text-xs">{delivery ? "אספקה" : "איסוף עצמי"}</p>
          <p className="font-display text-xl font-bold">{formatDeliveryDateHe(order.deliveryDate)}</p>
          <p className="mt-2 text-sm">
            {order.address ? formatAddress(order.address) : "מהמטבח של קאי, בין 10:00 ל-18:00"}
          </p>
        </div>
      </div>

      <section className="space-y-3 rounded-3xl bg-paper p-5 ring-1 ring-line" aria-labelledby="summary-title">
        <h2 id="summary-title" className="font-display text-xl font-bold">סיכום הזמנה</h2>
        <OrderLines order={order} />
      </section>

      <p className="rounded-2xl bg-cream p-4 text-center text-sm text-muted ring-1 ring-line">
        מצב הדגמה: לא בוצע חיוב אמיתי, וההזמנה נשמרה בדפדפן הזה בלבד. סליקה מאובטחת וחשבונית דיגיטלית יתווספו עם החיבור לספק התשלומים.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href={user ? "/orders" : "/login"} className="rounded-full bg-ink px-7 py-3 text-sm font-bold text-paper hover:bg-brand-500">
          {user ? "להזמנות שלי" : "התחברות לצפייה בהזמנות"}
        </Link>
        <Link href="/catalog" className="rounded-full px-7 py-3 text-sm font-bold ring-1 ring-line hover:bg-brand-50">
          חזרה לתפריט
        </Link>
      </div>
      {!user && (
        <p className="text-center text-xs text-muted">התחברו עם אותה כתובת מייל ({order.contact.email}) וההזמנה תופיע תחת ״ההזמנות שלי״.</p>
      )}
    </div>
  );
}
