"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LocalAdminData, LocalOrder, LocalProduct, LocalPromotion, OrderStatus, ProductOverride } from "@/lib/local-admin";

/**
 * LOCAL MOCK ADMIN DATA — the admin's edits and the placed orders, kept in this
 * browser's localStorage (same idea as the mock login in context/AuthContext).
 * See lib/local-admin.ts for how it layers on the catalog and what replaces it.
 */
interface AdminState extends LocalAdminData {
  /** Merge changes into a seed product's override; `undefined` clears a field. */
  patchProduct: (id: string, patch: ProductOverride) => void;
  resetProduct: (id: string) => void;
  addProduct: (product: Omit<LocalProduct, "id">) => string;
  patchAddedProduct: (id: string, patch: Partial<Omit<LocalProduct, "id">>) => void;
  /** Create or replace a promotion (also how a built-in "seed-…" promotion is edited). */
  savePromotion: (promotion: LocalPromotion) => void;
}

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      overrides: {},
      added: [],
      promotions: [],
      patchProduct: (id, patch) =>
        set((s) => {
          const next: ProductOverride = { ...s.overrides[id], ...patch };
          for (const k of Object.keys(next) as (keyof ProductOverride)[]) if (next[k] === undefined) delete next[k];
          const overrides = { ...s.overrides, [id]: next };
          if (!Object.keys(next).length) delete overrides[id];
          return { overrides };
        }),
      resetProduct: (id) =>
        set((s) => {
          const overrides = { ...s.overrides };
          delete overrides[id];
          return { overrides };
        }),
      addProduct: (product) => {
        const id = newId("local");
        set((s) => ({ added: [...s.added, { ...product, id }] }));
        return id;
      },
      patchAddedProduct: (id, patch) => set((s) => ({ added: s.added.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      savePromotion: (promotion) =>
        set((s) => ({
          promotions: s.promotions.some((p) => p.id === promotion.id)
            ? s.promotions.map((p) => (p.id === promotion.id ? promotion : p))
            : [...s.promotions, promotion],
        })),
    }),
    { name: "super-kai-admin", version: 1 },
  ),
);

export const newPromotionId = () => newId("promo");

interface OrdersState {
  orders: LocalOrder[];
  nextOrderNumber: number;
  placeOrder: (order: Omit<LocalOrder, "id" | "orderNumber" | "createdAt" | "status">) => LocalOrder;
  setStatus: (id: string, status: OrderStatus) => void;
  /** True once sample orders were offered, so clearing them doesn't bring them back. */
  demoSeeded: boolean;
  seedDemo: (orders: LocalOrder[]) => void;
  clearDemo: () => void;
  /** Kitchen checklist: "<deliveryDate>:<productId>" → prepared. */
  prepped: Record<string, boolean>;
  togglePrepped: (key: string) => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: [],
      nextOrderNumber: 1001,
      placeOrder: (draft) => {
        const orderNumber = get().nextOrderNumber;
        const order: LocalOrder = {
          ...draft,
          id: newId("order"),
          orderNumber,
          // No payment step in the mock: the order waits for the admin's approval.
          status: "PENDING_PAYMENT",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ orders: [...s.orders, order], nextOrderNumber: orderNumber + 1 }));
        return order;
      },
      setStatus: (id, status) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
      demoSeeded: false,
      seedDemo: (demo) => set((s) => ({ orders: [...s.orders.filter((o) => !o.isDemo), ...demo], demoSeeded: true })),
      clearDemo: () => set((s) => ({ orders: s.orders.filter((o) => !o.isDemo), demoSeeded: true })),
      prepped: {},
      togglePrepped: (key) =>
        set((s) => {
          const prepped = { ...s.prepped };
          if (prepped[key]) delete prepped[key];
          else prepped[key] = true;
          return { prepped };
        }),
    }),
    { name: "super-kai-orders", version: 1 },
  ),
);

// Edits made in another tab (e.g. admin in one tab, the shop in another) show up here too.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "super-kai-admin" || e.key === null) void useAdminStore.persist.rehydrate();
    if (e.key === "super-kai-orders" || e.key === null) void useOrdersStore.persist.rehydrate();
  });
}
