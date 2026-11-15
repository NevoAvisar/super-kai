"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { verifyCustomerAddress } from "@/app/admin/customers/actions";
import { addCustomerAccount, isEmailTaken, listCustomerAccounts, setCustomerAddress, type CustomerAccount } from "@/context/AuthContext";
import { OrderStatusBadge } from "@/components/OrderCard";
import { customerTier, favoriteDishes, TIER_LABEL, zoneForCity, type CustomerTier } from "@/lib/admin-analytics";
import { formatDeliveryDateHe } from "@/lib/delivery-date";
import { formatAddress, type AddressErrors, type CustomerAddress } from "@/lib/il-address/validate";
import { buildCustomers, type AdminCustomer } from "@/lib/local-admin";
import { formatILS } from "@/lib/money";
import { useOrdersStore } from "@/store/admin";
import { AddressFields, draftErrors, draftFromAddress, draftToInput, EMPTY_ADDRESS, type AddressDraft } from "./AddressFields";
import { inputClass, Labeled, primaryButton, quietButton } from "./AdminShell";
import { SERIES } from "./charts";

const PHONE = /^0(5\d|[2-489]|7\d)-?\d{7}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dayText = (iso: string) => new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(iso));

type Sort = "revenue" | "name" | "orders" | "recent";
const SORT_LABEL: Record<Sort, string> = {
  revenue: "תזרים תשלומים (מהגבוה)",
  name: "שם לקוח (א-ת)",
  orders: "כמות הזמנות",
  recent: "הזמנה אחרונה",
};
const SORTERS: Record<Sort, (a: AdminCustomer, b: AdminCustomer) => number> = {
  revenue: (a, b) => b.totalAgorot - a.totalAgorot,
  name: (a, b) => a.name.localeCompare(b.name, "he"),
  orders: (a, b) => b.orders.length - a.orders.length,
  recent: (a, b) => (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""),
};

const TIER_CLASS: Record<CustomerTier, string> = {
  vip: "bg-viz-yellow/25 text-amber-900",
  regular: "bg-viz-blue/15 text-viz-blue",
  new: "bg-line text-muted",
};

/** A stable colour per customer (from the email), so the same person keeps the same avatar everywhere. */
function avatarColor(email: string): string {
  let h = 0;
  for (const ch of email) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SERIES[h % SERIES.length];
}

function Avatar({ customer, size = "size-10" }: { customer: AdminCustomer; size?: string }) {
  const color = avatarColor(customer.email);
  return (
    <span
      aria-hidden
      className={`flex ${size} shrink-0 items-center justify-center rounded-full font-display text-base font-bold text-ink`}
      style={{ background: `color-mix(in srgb, ${color} 28%, white)`, boxShadow: `inset 0 0 0 2px ${color}` }}
    >
      {customer.name.trim().charAt(0)}
    </span>
  );
}

function TierBadge({ customer }: { customer: AdminCustomer }) {
  const tier = customerTier(customer);
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${TIER_CLASS[tier]}`}>{TIER_LABEL[tier]}</span>;
}

/** The customer directory: value ranking, tiers, sorting and a drawer with each customer's history. */
export function CustomersManager() {
  const orders = useOrdersStore((s) => s.orders);
  /** null until localStorage has been read. */
  const [accounts, setAccounts] = useState<CustomerAccount[] | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("revenue");
  const [tier, setTier] = useState<CustomerTier | "">("");
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
  const shown = customers
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.includes(q) || (c.phone ?? "").includes(q) || (c.city ?? "").includes(q))
    .filter((c) => !tier || customerTier(c) === tier)
    .sort((a, b) => SORTERS[sort](a, b) || a.name.localeCompare(b.name, "he"));
  const opened = customers.find((c) => c.email === openEmail);
  const tierCount = (t: CustomerTier) => customers.filter((c) => customerTier(c) === t).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">לקוחות</h1>
        <button type="button" onClick={() => setAdding((v) => !v)} className={`${primaryButton} ms-auto`} aria-expanded={adding}>
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון, עיר או מייל"
          aria-label="חיפוש לקוח"
          className={`${inputClass} lg:max-w-xs`}
        />
        <label className="flex items-center gap-2 text-sm">
          <span className="shrink-0 text-muted">מיון לפי</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`${inputClass} lg:w-56`}>
            {(Object.keys(SORT_LABEL) as Sort[]).map((s) => (
              <option key={s} value={s}>{SORT_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-2 lg:ms-auto" role="group" aria-label="סינון לפי סיווג">
          {([["", "הכול", customers.length], ...(["vip", "regular", "new"] as const).map((t) => [t, TIER_LABEL[t], tierCount(t)] as const)] as const).map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              aria-pressed={tier === value}
              onClick={() => setTier(value)}
              className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${tier === value ? "bg-ink text-paper ring-ink" : "bg-paper ring-line hover:ring-brand-500"}`}
            >
              {label} <span className="tabular-nums opacity-70">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-3xl bg-paper p-10 text-center ring-1 ring-line">
          <p className="font-display text-2xl font-bold">{customers.length ? "לא נמצאו לקוחות" : "עדיין אין לקוחות"}</p>
          <p className="mt-2 text-sm text-muted">לקוח שנרשם לאתר, מזמין בקופה או נוסף כאן ידנית יופיע ברשימה.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-paper ring-1 ring-line">
          <div className="hidden grid-cols-[2fr_1.2fr_1.3fr_1fr_0.7fr_1fr] gap-3 border-b border-line px-5 py-2.5 text-xs text-muted lg:grid">
            <span>לקוח</span>
            <span>טלפון</span>
            <span>עיר / אזור</span>
            <span>סך תשלומים</span>
            <span>הזמנות</span>
            <span>הזמנה אחרונה</span>
          </div>
          <ul className="divide-y divide-line">
            {shown.map((c) => (
              <li key={c.email}>
                <button
                  type="button"
                  onClick={() => setOpenEmail(c.email)}
                  aria-label={`פרטי הלקוח ${c.name}`}
                  className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-start text-sm transition hover:bg-cream sm:px-5 lg:grid-cols-[2fr_1.2fr_1.3fr_1fr_0.7fr_1fr]"
                >
                  <span className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                    <Avatar customer={c} />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate font-bold">{c.name}</span>
                        <TierBadge customer={c} />
                      </span>
                      <span className="block truncate text-xs text-muted lg:hidden">
                        {[c.city, c.phone].filter(Boolean).join(" · ") || c.email}
                      </span>
                    </span>
                  </span>
                  <span dir="ltr" className="hidden text-right text-muted lg:block">{c.phone ?? "—"}</span>
                  <span className="hidden min-w-0 lg:block">
                    <span className="block truncate">{c.city ?? "—"}</span>
                    {c.city && <span className="block truncate text-xs text-muted">{zoneForCity(c.city).label}</span>}
                  </span>
                  <span className="row-span-2 text-left lg:row-span-1 lg:text-start">
                    <span className="block font-display text-lg font-bold tabular-nums">{formatILS(c.totalAgorot)}</span>
                    <span className="block text-xs text-muted lg:hidden">{c.orders.length} הזמנות</span>
                  </span>
                  <span className="hidden tabular-nums lg:block">{c.orders.length}</span>
                  <span className="hidden text-muted tabular-nums lg:block">{c.lastOrderAt ? dayText(c.lastOrderAt) : "—"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {opened && (
        <CustomerDrawer
          customer={opened}
          canEditAddress={accounts.some((a) => a.email === opened.email)}
          onSaved={reload}
          onClose={() => setOpenEmail(null)}
        />
      )}
    </div>
  );
}

/** Client check, then the server's verdict; only the server's canonical address is ever stored. */
async function verifyDraft(draft: AddressDraft): Promise<{ address: CustomerAddress } | { errors: AddressErrors }> {
  const errors = draftErrors(draft);
  if (Object.keys(errors).length) return { errors };
  try {
    const res = await verifyCustomerAddress(draftToInput(draft));
    return res.ok ? { address: res.address } : { errors: res.errors };
  } catch {
    return { errors: { city: "לא ניתן לאמת את הכתובת כרגע. בדקו את החיבור ונסו שוב." } };
  }
}

function AddressEditor({ email, address, onSaved, onCancel }: { email: string; address: CustomerAddress | null; onSaved: () => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<AddressDraft>(() => draftFromAddress(address));
  const [errors, setErrors] = useState<AddressErrors>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await verifyDraft(draft);
    setBusy(false);
    if ("errors" in res) return setErrors(res.errors);
    if (!setCustomerAddress(email, res.address)) return setErrors({ city: "החשבון לא נמצא. רעננו את העמוד ונסו שוב." });
    onSaved();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <AddressFields value={draft} onChange={(next) => (setDraft(next), setErrors({}))} errors={errors} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={primaryButton}>{busy ? "בודק…" : "שמירת כתובת"}</button>
        <button type="button" onClick={onCancel} className={quietButton}>ביטול</button>
      </div>
    </form>
  );
}

function CustomerDrawer({ customer: c, canEditAddress, onSaved, onClose }: { customer: AdminCustomer; canEditAddress: boolean; onSaved: () => void; onClose: () => void }) {
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const favorites = favoriteDishes(c.orders);
  const paid = c.orders.filter((o) => o.status !== "CANCELLED").length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`פרטי הלקוח ${c.name}`}>
      <button type="button" aria-label="סגירה" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/40" />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-cream shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper p-5">
          <Avatar customer={c} size="size-12" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-bold">{c.name}</p>
            <TierBadge customer={c} />
          </div>
          <button type="button" onClick={onClose} aria-label="סגירה" autoFocus className="rounded-full p-2 text-muted hover:bg-brand-50 hover:text-ink">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-line text-center ring-1 ring-line">
            {[
              ["סך תשלומים", formatILS(c.totalAgorot)],
              ["הזמנות", String(c.orders.length)],
              ["ממוצע להזמנה", paid ? formatILS(Math.round(c.totalAgorot / paid)) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="bg-paper px-2 py-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="font-display text-lg font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="rounded-2xl bg-paper p-4 text-sm ring-1 ring-line">
            {c.phone && (
              <p>
                טלפון: <a dir="ltr" href={`tel:${c.phone}`} className="font-bold hover:text-brand-600">{c.phone}</a>
              </p>
            )}
            <p>
              מייל: <span dir="ltr" className="break-all">{c.email}</span>
            </p>
            {c.city && <p>עיר: {c.city} · {zoneForCity(c.city).label}</p>}
            <p className="text-muted">{c.registered ? "יש ללקוח חשבון באתר" : "הזמין כאורח, בלי חשבון"}</p>
          </div>

          {(c.address || canEditAddress) && (
            <section className="rounded-2xl bg-paper p-4 text-sm ring-1 ring-line">
              {editing ? (
                <AddressEditor
                  email={c.email}
                  address={c.address}
                  onCancel={() => setEditing(false)}
                  onSaved={() => {
                    onSaved();
                    setEditing(false);
                  }}
                />
              ) : (
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold">כתובת</h3>
                    <p className={c.address ? "" : "text-muted"}>{c.address ? formatAddress(c.address) : "עדיין לא הוזנה כתובת."}</p>
                  </div>
                  {canEditAddress && (
                    <button type="button" onClick={() => setEditing(true)} className={quietButton}>
                      {c.address ? "עריכה" : "הוספת כתובת"}
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <section>
            <h3 className="font-display text-lg font-bold">המנות האהובות</h3>
            {favorites.length ? (
              <ol className="mt-2 space-y-1.5 text-sm">
                {favorites.map((f, i) => (
                  <li key={f.productId} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 ring-1 ring-line">
                    <span className="font-display font-bold text-brand-600">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted">ב-{f.orders} הזמנות</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-1 text-sm text-muted">עדיין אין הזמנות.</p>
            )}
          </section>

          <section>
            <h3 className="font-display text-lg font-bold">היסטוריית הזמנות</h3>
            {c.orders.length ? (
              <ul className="mt-2 space-y-2 text-sm">
                {c.orders.map((o) => (
                  <li key={o.id} className="rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-bold">הזמנה {o.orderNumber}</span>
                      <OrderStatusBadge status={o.status} />
                      <span className="ms-auto font-bold tabular-nums">{formatILS(o.totals.totalAgorot)}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {o.fulfillment === "DELIVERY" ? "אספקה" : "איסוף"} ב{formatDeliveryDateHe(o.deliveryDate)} · {o.lines.map((l) => l.name).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">הלקוח עוד לא הזמין.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function AddCustomerForm({ onAdded, onCancel }: { onAdded: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [address, setAddress] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const phone = f.phone.replace(/\s/g, "");
    const next: Record<string, string | undefined> = {
      name: f.name.trim().length < 2 ? "נא למלא שם מלא." : undefined,
      email: !EMAIL.test(f.email.trim()) ? "כתובת מייל לא תקינה." : undefined,
      phone: phone && !PHONE.test(phone) ? "מספר טלפון לא תקין." : undefined,
      password: f.password.length < 6 ? "סיסמה של 6 תווים לפחות." : undefined,
    };
    if (!next.email && isEmailTaken(f.email)) next.email = "כתובת האימייל הזו כבר רשומה.";
    setErrors(next);
    // The address is always checked, so every problem shows in one go.
    setBusy(true);
    const verified = await verifyDraft(address);
    setBusy(false);
    setAddressErrors("errors" in verified ? verified.errors : {});
    if ("errors" in verified || Object.values(next).some(Boolean)) return;

    const res = addCustomerAccount({ name: f.name, email: f.email, phone, password: f.password, address: verified.address });
    if (res.ok) return onAdded();
    setErrors({ ...next, email: res.error });
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
      <AddressFields value={address} onChange={(next) => (setAddress(next), setAddressErrors({}))} errors={addressErrors} />
      <p className="text-xs text-muted">
        עיר ורחוב נבחרים מהרשימה הרשמית של יישובי ורחובות ישראל (data.gov.il) ונבדקים שוב בשרת לפני השמירה. הלקוח יוכל להתחבר לאתר עם המייל והסיסמה הזמנית.
      </p>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={primaryButton}>{busy ? "בודק כתובת…" : "הוספת לקוח"}</button>
        <button type="button" onClick={onCancel} className={quietButton}>ביטול</button>
      </div>
    </form>
  );
}
