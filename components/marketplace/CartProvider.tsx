"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartProduct = {
  id: string; slug: string; name: string; category: string | null;
  price: number; stock: number; quantity: number;
};
type CartContextValue = {
  items: CartProduct[]; itemCount: number; subtotal: number;
  addItem: (product: Omit<CartProduct, "quantity">, quantity?: number) => { ok: boolean; message: string };
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void; clearCart: () => void;
};
const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "agriva-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed.filter((item): item is CartProduct =>
          item && typeof item.id === "string" && !item.id.startsWith("sample-") &&
          typeof item.slug === "string" && typeof item.name === "string" &&
          Number.isFinite(Number(item.price)) && Number(item.price) >= 0 &&
          Number.isFinite(Number(item.stock)) && Number.isInteger(Number(item.quantity)) &&
          Number(item.quantity) > 0
        ).map(item => ({ ...item, price: Number(item.price), stock: Number(item.stock), quantity: Math.min(Number(item.quantity), Number(item.stock)) }))
          .filter(item => item.stock > 0 && item.quantity > 0));
      }
    } catch { /* Ignore malformed or unavailable local storage. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch { /* Cart remains usable for the current session. */ }
  }, [items, ready]);

  const addItem = useCallback((product: Omit<CartProduct, "quantity">, quantity = 1) => {
    if (product.id.startsWith("sample-")) return { ok: false, message: "নমুনা পণ্য কার্টে যোগ করা যাবে না।" };
    if (!Number.isFinite(product.price) || product.price < 0) return { ok: false, message: "পণ্যের মূল্য যাচাই করা যাচ্ছে না।" };
    if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, message: "সঠিক পরিমাণ নির্বাচন করুন।" };
    if (product.stock < 1) return { ok: false, message: "পণ্যটি বর্তমানে স্টকে নেই।" };
    setItems(current => {
      const existing = current.find(item => item.id === product.id);
      const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.stock);
      if (existing && nextQuantity === existing.quantity) return current;
      if (existing) return current.map(item => item.id === product.id ? { ...item, ...product, quantity: nextQuantity } : item);
      return [...current, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
    return { ok: true, message: "পণ্যটি কার্টে যোগ হয়েছে।" };
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    setItems(current => current.map(item => item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item));
  }, []);
  const removeItem = useCallback((id: string) => setItems(current => current.filter(item => item.id !== id)), []);
  const clearCart = useCallback(() => setItems([]), []);
  const value = useMemo(() => ({
    items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem, setQuantity, removeItem, clearCart,
  }), [items, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
