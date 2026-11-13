"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addCustomerAccount, listCustomerAccounts, type CustomerAccount } from "@/context/AuthContext";
import { OrderStatusBadge } from "@/components/OrderCard";
import { formatDeliveryDateHe } from "@/lib/delivery-date";
import { buildCustomers } from "@/lib/local-admin";
import { formatILS } from "@/lib/money";
import { useOrdersStore } from "@/store/admin";
import { inputClass, Labeled, primaryButton, quietButton } from "./AdminShell";

const PHONE = /^0(5\d|[2-489]|7\d)-?\d{7}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dayText = (iso: string) => new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(iso));

/** Everyone who has an account or placed an order, with their order history, plus adding a customer. */
export function CustomersManager() {
  const orders = useOrdersStore((s) => s.orders);
  /** null until localStorage has been read. */
  const [accounts, setAccounts] = useState<CustomerAccount[] | null>(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  const reload = useCallback(() => setAccounts(listCustomerAccounts()), []);
  useEffect(() => {
    reload();
    // A customer who signs up in another tab appears here too.
    window.addEventListener("storage", reload);
    return () => window.removeEventListener("storage", reload);
  }, [reload]);

  const customers = useMemo(() => buildCustomers(accounts ?? [], orders), [accounts, orders]);

  if (!accounts) return <p className="py-16 text-center text-muted">טוען…</p>;

  const q = query.trim().toLowerCase();
  const shown = customers.filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.includes(q) || (c.phone ?? "").includes(q));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם, מייל או טלפון"
          aria-label="חיפוש לקוח"
          className={`${inputClass} sm:max-w-xs`}
        />
        <span className="text-sm text-muted">{shown.length} לקוחות</span>
        <button type="button" onClick={() => setAdding((v) => !v)} className={`${primaryButton} sm:ms-auto`} aria-expanded={adding}>
          {adding ? "סגירה" : "+ הוספת לקוח"}
        </button>
      </div>

      {adding && (
        <AddCustomerForm
          onCancel={() => setAdding(false)}
          onAdded={() => {
            reload();
            setAdding(false);
          }}
        />
      )}

      {shown.length === 0 && (
        <div className="rounded-3xl bg-paper p-10 text-center ring-1 ring-line">
          <p className="font-display text-2xl font-bold">{customers.length ? "לא נמצאו לקוחות" : "עדיין אין לקוחות"}</p>
          <p className="mt-2 text-sm text-muted">לקוח שנרשם לאתר, מזמין בקופה או נוסף כאן ידנית יופיע ברשימה.</p>
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((c) => {
          const open = openEmail === c.email;
          return (
            <li key={c.email} className="rounded-3xl bg-paper p-4 ring-1 ring-line sm:p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold leading-tight">{c.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.registered ? "bg-leaf-50 text-leaf-700" : "bg-line text-muted"}`}>
                      {c.registered ? "רשום" : "אורח"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    <span dir="ltr" className="break-all">{c.email}</span>
                    {c.phone && (
                      <>
                        {" · "}
                        <a dir="ltr" href={`tel:${c.phone}`} className="hover:text-brand-600">{c.phone}</a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <p>
                    <span className="font-bold">{c.orders.length}</span> הזמנות · <span className="font-bold tabular-nums">{formatILS(c.totalAgorot)}</span>
                    {c.lastOrderAt && <span className="text-muted"> · אחרונה ב-{dayText(c.lastOrderAt)}</span>}
                  </p>
                  {c.orders.length > 0 && (
                    <button type="button" onClick={() => setOpenEmail(open ? null : c.email)} aria-expanded={open} className={quietButton}>
                      {open ? "הסתרת הזמנות" : "הצגת הזמנות"}
                    </button>
                  )}
                </div>
              </div>
              {open && (
                <ul className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                  {c.orders.map((o) => (
                    <li key={o.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold">הזמנה {o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                      <span className="text-muted">
                        {o.fulfillment === "DELIVERY" ? "אספקה" : "איסוף"} ב{formatDeliveryDateHe(o.deliveryDate)}
                      </span>
                      <span className="ms-auto font-bold tabular-nums">{formatILS(o.totals.totalAgorot)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AddCustomerForm({ onAdded, onCancel }: { onAdded: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const phone = f.phone.replace(/\s/g, "");
    const next: Record<string, string | undefined> = {
      name: f.name.trim().length < 2 ? "נא למלא שם מלא." : undefined,
      email: !EMAIL.test(f.email.trim()) ? "כתובת מייל לא תקינה." : undefined,
      phone: phone && !PHONE.test(phone) ? "מספר טלפון לא תקין." : undefined,
      password: f.password.length < 6 ? "סיסמה של 6 תווים לפחות." : undefined,
    };
    if (!Object.values(next).some(Boolean)) {
      const res = addCustomerAccount({ name: f.name, email: f.email, phone, password: f.password });
      if (res.ok) return onAdded();
      next.email = res.error;
    }
    setErrors(next);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl bg-paper p-5 ring-1 ring-line sm:p-6">
      <h2 className="font-display text-2xl font-bold">לקוח חדש</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="שם מלא" error={errors.name}>
          <input value={f.name} onChange={(e) => set("name")(e.target.value)} autoComplete="off" className={inputClass} />
        </Labeled>
        <Labeled label="מייל" error={errors.email}>
          <input type="email" value={f.email} onChange={(e) => set("email")(e.target.value)} autoComplete="off" dir="ltr" className={`${inputClass} text-right`} />
        </Labeled>
        <Labeled label="טלפון (לא חובה)" error={errors.phone}>
          <input type="tel" value={f.phone} onChange={(e) => set("phone")(e.target.value)} autoComplete="off" dir="ltr" className={`${inputClass} text-right`} />
        </Labeled>
        <Labeled label="סיסמה זמנית" error={errors.password}>
          <input value={f.password} onChange={(e) => set("password")(e.target.value)} autoComplete="off" dir="ltr" className={`${inputClass} text-right`} />
        </Labeled>
      </div>
      <p className="text-xs text-muted">הלקוח יוכל להתחבר לאתר עם המייל והסיסמה הזמנית, והפרטים ימולאו עבורו בקופה.</p>
      <div className="flex gap-2">
        <button type="submit" className={primaryButton}>הוספת לקוח</button>
        <button type="button" onClick={onCancel} className={quietButton}>ביטול</button>
      </div>
    </form>
  );
}
