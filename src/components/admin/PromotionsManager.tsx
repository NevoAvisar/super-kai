"use client";

import { useMemo, useState } from "react";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import {
  adminProducts,
  allPromotions,
  isBuiltInPromotion,
  promotionPhase,
  type LocalPromotion,
  type PromotionPhase,
  type PromotionType,
} from "@/lib/local-admin";
import { useLocalAdminData, useMinuteClock } from "@/lib/use-live-catalog";
import { useHydrated } from "@/lib/use-hydrated";
import { formatILS } from "@/lib/money";
import { newPromotionId, useAdminStore } from "@/store/admin";
import { inputClass, Labeled, parseShekels, primaryButton, quietButton, shekelsText } from "./AdminShell";

interface Props {
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

const TYPE_LABEL: Record<PromotionType, string> = {
  PERCENT_OFF: "אחוז הנחה",
  AMOUNT_OFF: "הנחה בשקלים",
  FIXED_PRICE: "מחיר מבצע קבוע",
};

const PHASE: Record<PromotionPhase, { label: string; className: string }> = {
  live: { label: "פעיל", className: "bg-leaf-50 text-leaf-700" },
  scheduled: { label: "מתוזמן", className: "bg-amber-50 text-amber-800" },
  ended: { label: "הסתיים", className: "bg-line text-muted" },
  disabled: { label: "מושבת", className: "bg-line text-muted" },
};

const pad = (n: number) => String(n).padStart(2, "0");
/** ISO → the local "YYYY-MM-DDTHH:mm" a datetime-local input expects. */
function toInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromInput = (v: string) => (v ? new Date(v).toISOString() : null);
const dateText = (iso: string) =>
  new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

function valueText(p: LocalPromotion): string {
  if (p.type === "PERCENT_OFF") return `${p.value}% הנחה`;
  if (p.type === "AMOUNT_OFF") return `${formatILS(p.value)} הנחה`;
  return `מחיר מבצע ${formatILS(p.value)}`;
}

export function PromotionsManager({ categories, products }: Props) {
  const hydrated = useHydrated();
  const data = useLocalAdminData();
  const now = useMinuteClock();
  const savePromotion = useAdminStore((s) => s.savePromotion);
  /** null = closed, "new" = empty form, otherwise the promotion being edited. */
  const [editing, setEditing] = useState<LocalPromotion | "new" | null>(null);

  const rows = useMemo(() => adminProducts(products, data, now), [products, data, now]);
  const promos = useMemo(() => allPromotions(products, data), [products, data]);
  const productName = useMemo(() => new Map(rows.map((p) => [p.id, p.name])), [rows]);
  const categoryName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);

  if (!hydrated) return <p className="py-16 text-center text-muted">טוען…</p>;

  const order: PromotionPhase[] = ["live", "scheduled", "disabled", "ended"];
  const sorted = [...promos].sort((a, b) => order.indexOf(promotionPhase(a, now)) - order.indexOf(promotionPhase(b, now)));

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-bold">מבצעים</h1>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted">{promos.length} מבצעים · כשכמה מבצעים חלים על אותה מנה, הלקוח מקבל את המחיר הנמוך ביותר.</p>
        <button type="button" onClick={() => setEditing(editing === "new" ? null : "new")} className={`${primaryButton} ms-auto`}>
          {editing === "new" ? "סגירה" : "+ מבצע חדש"}
        </button>
      </div>

      {editing === "new" && (
        <PromotionForm
          key="new"
          categories={categories}
          products={rows}
          onCancel={() => setEditing(null)}
          onSave={(p) => {
            savePromotion(p);
            setEditing(null);
          }}
        />
      )}

      {sorted.length === 0 && <p className="py-12 text-center text-muted">עדיין אין מבצעים.</p>}

      <ul className="space-y-3">
        {sorted.map((p) => {
          const phase = PHASE[promotionPhase(p, now)];
          const target = p.productId
            ? `מנה: ${productName.get(p.productId) ?? "מוצר שהוסר"}`
            : `קטגוריה: ${categoryName.get(p.categoryId ?? "") ?? p.categoryId}`;
          return (
            <li key={p.id} className="rounded-3xl bg-paper p-4 ring-1 ring-line sm:p-5">
              {editing !== "new" && editing?.id === p.id ? (
                <PromotionForm
                  key={p.id}
                  initial={p}
                  categories={categories}
                  products={rows}
                  onCancel={() => setEditing(null)}
                  onSave={(next) => {
                    savePromotion(next);
                    setEditing(null);
                  }}
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-bold leading-tight">{p.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${phase.className}`}>{phase.label}</span>
                      {isBuiltInPromotion(p.id) && <span className="rounded-full bg-cream px-2 py-0.5 text-xs text-muted">מהקטלוג</span>}
                    </div>
                    <p className="mt-1 text-sm">{target} · <span className="font-bold">{valueText(p)}</span></p>
                    <p className="text-xs text-muted">
                      {new Date(p.startsAt).getFullYear() < 2021 ? "מבצע קבוע" : `מ-${dateText(p.startsAt)}`}{" "}
                      {p.endsAt ? `עד ${dateText(p.endsAt)}` : "· ללא תאריך סיום"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => savePromotion({ ...p, isActive: !p.isActive })} className={quietButton}>
                      {p.isActive ? "השבתה" : "הפעלה"}
                    </button>
                    <button type="button" onClick={() => setEditing(p)} className={quietButton}>
                      עריכה
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PromotionForm({ initial, categories, products, onSave, onCancel }: {
  initial?: LocalPromotion;
  categories: CatalogCategory[];
  products: { id: string; name: string; categorySlug: string }[];
  onSave: (p: LocalPromotion) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState(() => ({
    title: initial?.title ?? "",
    target: (initial?.categoryId ? "category" : "product") as "product" | "category",
    productId: initial?.productId ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.slug ?? "",
    type: initial?.type ?? ("PERCENT_OFF" as PromotionType),
    value: initial ? (initial.type === "PERCENT_OFF" ? String(initial.value) : shekelsText(initial.value)) : "",
    startsAt: toInput(initial?.startsAt ?? new Date().toISOString()),
    endsAt: toInput(initial?.endsAt ?? null),
  }));
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const percent = Number(f.value);
    const value = f.type === "PERCENT_OFF" ? (Number.isInteger(percent) && percent >= 1 && percent <= 100 ? percent : null) : parseShekels(f.value);
    const startsAt = fromInput(f.startsAt);
    const endsAt = fromInput(f.endsAt);
    const next = {
      title: f.title.trim().length < 2 ? "נא למלא כותרת שתופיע על המנה." : undefined,
      target: f.target === "product" && !f.productId ? "נא לבחור מנה." : f.target === "category" && !f.categoryId ? "נא לבחור קטגוריה." : undefined,
      value: !value ? (f.type === "PERCENT_OFF" ? "אחוז שלם בין 1 ל-100." : "נא למלא סכום גדול מאפס.") : undefined,
      startsAt: !startsAt ? "נא לבחור תאריך התחלה." : undefined,
      endsAt: startsAt && endsAt && endsAt <= startsAt ? "תאריך הסיום צריך להיות אחרי ההתחלה." : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    onSave({
      id: initial?.id ?? newPromotionId(),
      title: f.title.trim(),
      type: f.type,
      value: value!,
      productId: f.target === "product" ? f.productId : null,
      categoryId: f.target === "category" ? f.categoryId : null,
      startsAt: startsAt!,
      endsAt,
      isActive: initial?.isActive ?? true,
    });
  }

  return (
    <form onSubmit={submit} noValidate className={`space-y-4 ${initial ? "" : "rounded-3xl bg-paper p-5 ring-1 ring-line sm:p-6"}`}>
      <h2 className="font-display text-2xl font-bold">{initial ? "עריכת מבצע" : "מבצע חדש"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="כותרת (מופיעה על המנה)" error={errors.title} className="sm:col-span-2">
          <input value={f.title} onChange={(e) => set("title")(e.target.value)} placeholder="15% הנחה" className={inputClass} />
        </Labeled>
        <Labeled label="המבצע חל על">
          <select value={f.target} onChange={(e) => set("target")(e.target.value as "product" | "category")} className={inputClass}>
            <option value="product">מנה אחת</option>
            <option value="category">קטגוריה שלמה</option>
          </select>
        </Labeled>
        {f.target === "product" ? (
          <Labeled label="מנה" error={errors.target}>
            <select value={f.productId} onChange={(e) => set("productId")(e.target.value)} className={inputClass}>
              <option value="">בחירת מנה…</option>
              {categories.map((c) => (
                <optgroup key={c.slug} label={c.name}>
                  {products.filter((p) => p.categorySlug === c.slug).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Labeled>
        ) : (
          <Labeled label="קטגוריה" error={errors.target}>
            <select value={f.categoryId} onChange={(e) => set("categoryId")(e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Labeled>
        )}
        <Labeled label="סוג ההנחה">
          <select value={f.type} onChange={(e) => setF((s) => ({ ...s, type: e.target.value as PromotionType, value: "" }))} className={inputClass}>
            {(Object.keys(TYPE_LABEL) as PromotionType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t]}</option>
            ))}
          </select>
        </Labeled>
        <Labeled label={f.type === "PERCENT_OFF" ? "אחוז הנחה (%)" : f.type === "AMOUNT_OFF" ? "סכום ההנחה (₪)" : "מחיר המבצע (₪)"} error={errors.value}>
          <input value={f.value} onChange={(e) => set("value")(e.target.value)} inputMode="decimal" dir="ltr" className={`${inputClass} text-right`} />
        </Labeled>
        <Labeled label="מתחיל ב-" error={errors.startsAt}>
          <input type="datetime-local" value={f.startsAt} onChange={(e) => set("startsAt")(e.target.value)} className={inputClass} />
        </Labeled>
        <Labeled label="מסתיים ב- (לא חובה)" error={errors.endsAt}>
          <input type="datetime-local" value={f.endsAt} onChange={(e) => set("endsAt")(e.target.value)} className={inputClass} />
        </Labeled>
      </div>
      <div className="flex gap-2">
        <button type="submit" className={primaryButton}>{initial ? "שמירה" : "יצירת מבצע"}</button>
        <button type="button" onClick={onCancel} className={quietButton}>ביטול</button>
      </div>
    </form>
  );
}
