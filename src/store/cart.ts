"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decrementQuantity, incrementQuantity, stepFor, type SaleUnit } from "@/lib/quantity";
import type { FulfillmentType } from "@/lib/pricing";

/**
 * Client-side cart. Guests can fill it freely (persisted to localStorage).
 * At checkout / login it is synced into the DB Cart (step 2), and the server
 * re-prices every line — prices stored here are display snapshots only.
 */
export interface CartItem {
  productId: string;
  name: string;
  icon: string | null;
  imageUrl?: string | null;
  saleUnit: SaleUnit;
  unitPriceAgorot: number;
  listPriceAgorot: number;
  quantity: number;
}

interface CartState {
  items: Record<string, CartItem>;
  fulfillment: FulfillmentType;
  add: (item: Omit<CartItem, "quantity">) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setFulfillment: (f: FulfillmentType) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: {},
      fulfillment: "DELIVERY",
      add: (item) =>
        set((s) => {
          const existing = s.items[item.productId];
          const quantity = existing
            ? incrementQuantity(existing.quantity, item.saleUnit)
            : stepFor(item.saleUnit); // first click = 0.25 kg / 1 unit
          return { items: { ...s.items, [item.productId]: { ...item, quantity } } };
        }),
      increment: (id) =>
        set((s) => {
          const it = s.items[id];
          if (!it) return s;
          return { items: { ...s.items, [id]: { ...it, quantity: incrementQuantity(it.quantity, it.saleUnit) } } };
        }),
      decrement: (id) =>
        set((s) => {
          const it = s.items[id];
          if (!it) return s;
          const quantity = decrementQuantity(it.quantity, it.saleUnit);
          const items = { ...s.items };
          if (quantity === 0) delete items[id];
          else items[id] = { ...it, quantity };
          return { items };
        }),
      remove: (id) =>
        set((s) => {
          const items = { ...s.items };
          delete items[id];
          return { items };
        }),
      clear: () => set({ items: {} }),
      setFulfillment: (fulfillment) => set({ fulfillment }),
    }),
    {
      name: "super-kai-cart",
      // v3: catalog re-keyed (signature menu) — drop carts holding old product ids.
      version: 3,
      migrate: () => ({ items: {}, fulfillment: "DELIVERY" }) as unknown as CartState,
    },
  ),
);
