'use client';
// Cart state with localStorage persistence (temporary storage only; the
// server re-prices everything at checkout, so this is display state).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartExtra { id: number; name: string; priceCents: number }
export interface CartItem {
  key: string;
  productId: number;
  name: string;
  unitPriceCents: number;
  image: string;
  quantity: number;
  extras: CartExtra[];
  instructions: string;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, 'key'>) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  bumpToken: number;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = 'smp_cart_v1';

function keyOf(item: Omit<CartItem, 'key'>): string {
  const extras = item.extras.map((e) => e.id).sort((a, b) => a - b).join(',');
  return `${item.productId}|${extras}|${item.instructions.trim().toLowerCase()}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [bumpToken, setBumpToken] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* corrupted cart: start fresh */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  const add = useCallback((item: Omit<CartItem, 'key'>) => {
    const key = keyOf(item);
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Math.min(50, next[idx].quantity + item.quantity) };
        return next;
      }
      return [...prev, { ...item, key }];
    });
    setBumpToken((t) => t + 1);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((p) => p.key !== key) : prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(50, qty) } : p))
    );
  }, []);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((p) => p.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotalCents = items.reduce(
      (s, i) => s + (i.unitPriceCents + i.extras.reduce((x, e) => x + e.priceCents, 0)) * i.quantity, 0
    );
    return { items, count, subtotalCents, add, setQty, remove, clear, bumpToken };
  }, [items, add, setQty, remove, clear, bumpToken]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart outside CartProvider');
  return ctx;
}
