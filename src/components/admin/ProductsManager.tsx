"use client";

import { useMemo, useState } from "react";
import type { CatalogCategory, CatalogProduct } from "@/lib/catalog";
import { adminProducts, STOCK_LABEL, type AdminProduct, type StockStatus } from "@/lib/local-admin";
import { useLocalAdminData, useMinuteClock } from "@/lib/use-live-catalog";
import { useHydrated } from "@/lib/use-hydrated";
import { formatILS } from "@/lib/money";
import type { SaleUnit } from "@/lib/quantity";
import { useAdminStore } from "@/store/admin";
import { inputClass, Labeled, parseShekels, primaryButton, quietButton, shekelsText } from "./AdminShell";

interface Props {
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

const STOCK_OPTIONS = Object.keys(STOCK_LABEL) as StockStatus[];
const unitText = (u: SaleUnit) => (u === "KG" ? "לק״ג" : "ליח׳");

export function ProductsManager({ categories, products }: Props) {
  const hydrated = useHydrated();
  const data = useLocalAdminData();
  const now = useMinuteClock();
  const { patchProduct, patchAddedProduct, resetProduct } = useAdminStore.getState();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const baseById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const categoryName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);
  const rows = useMemo(() => adminProducts(products, data, now), [products, data, now]);

  if (!hydrated) return <p className="py-16 text-center text-muted">טוען…</p>;

  const q = query.trim();
  const shown = rows.filter((p) => (!q || p.name.includes(q)) && (!category || p.categorySlug === category));

  /** Saves a change; a seed field set back to its original value drops out of the override. */
  function update(p: AdminProduct, patch: { name?: string; priceAgorot?: number; stockStatus?: StockStatus; isActive?: boolean }) {
    if (p.isLocal) return patchAddedProduct(p.id, patch);
    const base = baseById.get(p.id)!;
    const baseStock: StockStatus = base.inStock ? "IN_STOCK" : "OUT_OF_STOCK";
    patchProduct(p.id, {
      ...("name" in patch && { name: patch.name === base.name ? undefined : patch.name }),
      ...("priceAgorot" in patch && { priceAgorot: patch.priceAgorot === base.listPriceAgorot ? undefined : patch.priceAgorot }),
      ...("stockStatus" in patch && { stockStatus: patch.stockStatus === baseStock ? undefined : patch.stockStatus }),
      ...("isActive" in patch && { isActive: patch.isActive ? undefined : false }),
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש לפי שם מוצר"
          aria-label="חיפוש מוצר"
          className={`${inputClass} sm:max-w-xs`}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="סינון לפי קטגוריה" className={`${inputClass} sm:max-w-56`}>
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <span className="text-sm text-muted">{shown.length} מוצרים</span>
        <button type="button" onClick={() => setAdding((v) => !v)} className={`${primaryButton} sm:ms-auto`} aria-expanded={adding}>
          {adding ? "סגירה" : "+ הוספת מוצר"}
        </button>
      </div>

      {adding && <AddProductForm categories={categories} onDone={() => setAdding(false)} />}

      {shown.length === 0 && <p className="py-12 text-center text-muted">לא נמצאו מוצרים.</p>}

      <ul className="space-y-3">
        {shown.map((p) => (
          <li key={p.id} className={`rounded-3xl bg-paper p-4 ring-1 ring-line sm:p-5 ${p.isActive ? "" : "opacity-70"}`}>
            {editingId === p.id ? (
              <EditProductForm
                product={p}
                onCancel={() => setEditingId(null)}
                onSave={(patch) => {
                  update(p, patch);
                  setEditingId(null);
                }}
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold leading-tight">{p.name}</h3>
                    {p.isLocal && <span className="rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-bold text-leaf-700">חדש</span>}
                    {p.isModified && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">נערך</span>}
                    {!p.isActive && <span className="rounded-full bg-line px-2 py-0.5 text-xs font-bold text-muted">מוסתר</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {categoryName.get(p.categorySlug) ?? p.categorySlug} ·{" "}
                    <span className="font-bold text-ink tabular-nums">{formatILS(p.listPriceAgorot)}</span> {unitText(p.saleUnit)}
                    {p.priceAgorot < p.listPriceAgorot && (
                      <span className="text-brand-600"> · במבצע {formatILS(p.priceAgorot)}</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={p.stockStatus}
                    onChange={(e) => update(p, { stockStatus: e.target.value as StockStatus })}
                    aria-label={`מצב מלאי של ${p.name}`}
                    className="rounded-full bg-paper px-3 py-2 text-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {STOCK_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STOCK_LABEL[s]}</option>
                    ))}
                  </select>
                  <label className="flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-sm ring-1 ring-line">
                    <input
                      type="checkbox"
                      checked={p.isActive}
                      onChange={(e) => update(p, { isActive: e.target.checked })}
                      className="size-4 accent-leaf-600"
                    />
                    מוצג באתר
                  </label>
                  <button type="button" onClick={() => setEditingId(p.id)} className={quietButton}>
                    עריכה
                  </button>
                  {p.isModified && (
                    <button type="button" onClick={() => resetProduct(p.id)} className="px-2 py-2 text-sm font-bold text-brand-600 hover:underline">
                      איפוס
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditProductForm({ product, onSave, onCancel }: {
  product: AdminProduct;
  onSave: (patch: { name: string; priceAgorot: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(shekelsText(product.listPriceAgorot));
  const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceAgorot = parseShekels(price);
    const next = {
      name: name.trim().length < 2 ? "נא למלא שם מוצר." : undefined,
      price: !priceAgorot ? "נא למלא מחיר גדול מאפס." : undefined,
    };
    setErrors(next);
    if (!next.name && !next.price) onSave({ name: name.trim(), priceAgorot: priceAgorot! });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-start">
      <Labeled label="שם המוצר" error={errors.name}>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
      </Labeled>
      <Labeled label={`מחיר ${unitText(product.saleUnit)} (₪)`} error={errors.price}>
        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" dir="ltr" className={`${inputClass} text-right`} />
      </Labeled>
      <div className="flex gap-2 sm:pt-6">
        <button type="submit" className={primaryButton}>שמירה</button>
        <button type="button" onClick={onCancel} className={quietButton}>ביטול</button>
      </div>
    </form>
  );
}

function AddProductForm({ categories, onDone }: { categories: CatalogCategory[]; onDone: () => void }) {
  const addProduct = useAdminStore((s) => s.addProduct);
  const [f, setF] = useState({
    name: "",
    description: "",
    categorySlug: categories[0]?.slug ?? "",
    saleUnit: "KG" as SaleUnit,
    price: "",
    unitWeight: "",
    unitLabel: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceAgorot = parseShekels(f.price);
    const grams = f.unitWeight.trim() ? Number(f.unitWeight) : null;
    const category = categories.find((c) => c.slug === f.categorySlug);
    const next = {
      name: f.name.trim().length < 2 ? "נא למלא שם מוצר." : undefined,
      price: !priceAgorot ? "נא למלא מחיר גדול מאפס." : undefined,
      unitWeight: grams !== null && (!Number.isInteger(grams) || grams <= 0) ? "משקל בגרמים, מספר שלם." : undefined,
      category: !category ? "נא לבחור קטגוריה." : undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || !category) return;
    const isUnit = f.saleUnit === "UNIT";
    addProduct({
      name: f.name.trim(),
      description: f.description.trim() || null,
      categorySlug: category.slug,
      categoryIcon: category.icon,
      portionGroup: category.portionGroup,
      saleUnit: f.saleUnit,
      priceAgorot: priceAgorot!,
      unitWeightGrams: isUnit ? grams : null,
      unitLabel: isUnit ? f.unitLabel.trim() || null : null,
      stockStatus: "IN_STOCK",
      isActive: true,
    });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl bg-paper p-5 ring-1 ring-line sm:p-6">
      <h2 className="font-display text-2xl font-bold">מוצר חדש</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="שם המוצר" error={errors.name}>
          <input value={f.name} onChange={(e) => set("name")(e.target.value)} className={inputClass} />
        </Labeled>
        <Labeled label="קטגוריה" error={errors.category}>
          <select value={f.categorySlug} onChange={(e) => set("categorySlug")(e.target.value)} className={inputClass}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Labeled>
        <Labeled label="תיאור קצר (לא חובה)" className="sm:col-span-2">
          <input value={f.description} onChange={(e) => set("description")(e.target.value)} className={inputClass} />
        </Labeled>
        <Labeled label="נמכר לפי">
          <select value={f.saleUnit} onChange={(e) => set("saleUnit")(e.target.value as SaleUnit)} className={inputClass}>
            <option value="KG">משקל (קפיצות של רבע קילו)</option>
            <option value="UNIT">יחידה (מיכל, צנצנת, מנה)</option>
          </select>
        </Labeled>
        <Labeled label={`מחיר ${unitText(f.saleUnit)} (₪)`} error={errors.price}>
          <input value={f.price} onChange={(e) => set("price")(e.target.value)} inputMode="decimal" dir="ltr" className={`${inputClass} text-right`} />
        </Labeled>
        {f.saleUnit === "UNIT" && (
          <>
            <Labeled label="משקל יחידה בגרמים (לא חובה)" error={errors.unitWeight}>
              <input value={f.unitWeight} onChange={(e) => set("unitWeight")(e.target.value)} inputMode="numeric" dir="ltr" className={`${inputClass} text-right`} />
            </Labeled>
            <Labeled label="תיאור היחידה (לא חובה)">
              <input value={f.unitLabel} onChange={(e) => set("unitLabel")(e.target.value)} placeholder="מיכל 400 גרם" className={inputClass} />
            </Labeled>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <button type="submit" className={primaryButton}>הוספה לקטלוג</button>
        <button type="button" onClick={onDone} className={quietButton}>ביטול</button>
      </div>
    </form>
  );
}
