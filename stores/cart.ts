"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { LIMITS } from "@/lib/site";

export type CartItem = { productId: string; name: string; unitPrice: number; quantity: number };
type StoreCart = {
  items: CartItem[];
  customerName: string;
  delivery: "domicilio" | "recoger" | null;
  note: string;
};
type CartState = {
  carts: Record<string, StoreCart>;
  add: (storeId: string, item: Omit<CartItem, "quantity">) => "ok" | "full";
  setQuantity: (storeId: string, productId: string, quantity: number) => void;
  remove: (storeId: string, productId: string) => void;
  setInfo: (storeId: string, info: Partial<Omit<StoreCart, "items">>) => void;
  clear: (storeId: string) => void;
};

const empty: StoreCart = { items: [], customerName: "", delivery: null, note: "" };

/** Carrito separado por tienda y guardado en el navegador (localStorage). */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},
      add: (storeId, item) => {
        const cart = get().carts[storeId] ?? empty;
        const existing = cart.items.find((i) => i.productId === item.productId);
        if (!existing && cart.items.length >= LIMITS.cartDistinctItems) return "full";
        const items = existing
          ? cart.items.map((i) =>
              i.productId === item.productId ? { ...i, quantity: Math.min(i.quantity + 1, LIMITS.cartQtyPerItem) } : i,
            )
          : [...cart.items, { ...item, quantity: 1 }];
        set({ carts: { ...get().carts, [storeId]: { ...cart, items } } });
        return "ok";
      },
      setQuantity: (storeId, productId, quantity) => {
        const cart = get().carts[storeId] ?? empty;
        const q = Math.max(0, Math.min(Math.floor(quantity), LIMITS.cartQtyPerItem));
        const items =
          q === 0
            ? cart.items.filter((i) => i.productId !== productId)
            : cart.items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i));
        set({ carts: { ...get().carts, [storeId]: { ...cart, items } } });
      },
      remove: (storeId, productId) => get().setQuantity(storeId, productId, 0),
      setInfo: (storeId, info) => {
        const cart = get().carts[storeId] ?? empty;
        set({ carts: { ...get().carts, [storeId]: { ...cart, ...info } } });
      },
      clear: (storeId) => {
        const { [storeId]: _removed, ...rest } = get().carts;
        void _removed;
        set({ carts: rest });
      },
    }),
    { name: "cw_carritos_v1", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

export function emptyCart(): StoreCart {
  return empty;
}
