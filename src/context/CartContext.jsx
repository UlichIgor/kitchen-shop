import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCatalog } from "./CatalogContext.jsx";

const STORAGE_KEY = "kitchen-shop-cart";
const CartContext = createContext(null);

function loadLines(products) {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(data)) return [];
    return data.filter((line) => line && Number.isInteger(line.qty) && line.qty > 0 &&
      products.some((product) => String(product.id) === String(line.id)))
      .map((line) => ({ id: line.id, qty: Math.min(line.qty, 99) }));
  } catch { return []; }
}

export function CartProvider({ children }) {
  const { products } = useCatalog();
  const [lines, setLines] = useState(() => loadLines(products));
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setLines((previous) => previous.filter((line) => products.some((product) => String(product.id) === String(line.id))));
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* localStorage недоступний */ }
  }, [lines]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const add = useCallback((id, qty = 1) => {
    const product = products.find((item) => String(item.id) === String(id));
    const amount = Number.isFinite(Number(qty)) ? Math.floor(Number(qty)) : 0;
    if (!product || amount < 1) return;
    setLines((previous) => {
      const found = previous.find((line) => String(line.id) === String(id));
      return found
        ? previous.map((line) => String(line.id) === String(id) ? { ...line, qty: Math.min(99, line.qty + amount) } : line)
        : [...previous, { id: product.id, qty: Math.min(99, amount) }];
    });
    setToast(`«${product.name}» додано в кошик`);
  }, [products]);

  const changeQty = useCallback((id, delta) => {
    const step = Number(delta);
    if (!Number.isFinite(step) || step === 0) return;
    setLines((previous) => previous.map((line) => String(line.id) === String(id)
      ? { ...line, qty: Math.min(99, Math.max(0, line.qty + step)) } : line).filter((line) => line.qty > 0));
  }, []);

  const remove = useCallback((id) => setLines((previous) => previous.filter((line) => String(line.id) !== String(id))), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const items = lines.map((line) => ({ ...line, product: products.find((product) => String(product.id) === String(line.id)) })).filter((line) => line.product);
    return {
      items,
      count: items.reduce((sum, item) => sum + item.qty, 0),
      total: items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
      add, changeQty, remove, clear, isOpen,
      openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false), toast,
    };
  }, [lines, products, isOpen, toast, add, changeQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart має використовуватись всередині CartProvider");
  return context;
}
