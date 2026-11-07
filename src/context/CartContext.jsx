import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS } from "../data/catalog.js";

const STORAGE_KEY = "kitchen-shop-cart";
const CartContext = createContext(null);

function loadLines() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    // Відкидаємо невідомі товари та пошкоджені/некоректні кількості.
    return data
      .filter(
        (line) =>
          line &&
          Number.isInteger(line.qty) &&
          line.qty > 0 &&
          PRODUCTS.some((product) => product.id === line.id)
      )
      .map((line) => ({ id: line.id, qty: Math.min(line.qty, 99) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(loadLines);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* localStorage може бути недоступний — це не критично */
    }
  }, [lines]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((id, qty = 1) => {
    const product = PRODUCTS.find((item) => item.id === id);
    const amount = Number.isFinite(Number(qty)) ? Math.floor(Number(qty)) : 0;
    if (!product || amount < 1) return;

    setLines((prev) => {
      const found = prev.find((line) => line.id === id);
      return found
        ? prev.map((line) =>
            line.id === id ? { ...line, qty: Math.min(99, line.qty + amount) } : line
          )
        : [...prev, { id, qty: Math.min(99, amount) }];
    });
    setToast(`«${product.name}» додано в кошик`);
  }, []);

  const changeQty = useCallback((id, delta) => {
    const step = Number(delta);
    if (!Number.isFinite(step) || step === 0) return;

    setLines((prev) =>
      prev
        .map((line) =>
          line.id === id
            ? { ...line, qty: Math.min(99, Math.max(0, line.qty + step)) }
            : line
        )
        .filter((line) => line.qty > 0)
    );
  }, []);

  const remove = useCallback((id) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const items = lines.map((l) => ({ ...l, product: PRODUCTS.find((p) => p.id === l.id) }));
    return {
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      total: items.reduce((s, i) => s + i.product.price * i.qty, 0),
      add,
      changeQty,
      remove,
      clear,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toast,
    };
  }, [lines, isOpen, toast, add, changeQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart має використовуватись всередині CartProvider");
  return ctx;
}
