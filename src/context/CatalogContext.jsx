import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PRODUCTS as FALLBACK_PRODUCTS, SECTIONS as FALLBACK_SECTIONS } from "../data/catalog.js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../lib/supabase.js";

const CatalogContext = createContext(null);

async function readTable(table, query) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
  });
  if (!response.ok) throw new Error(`Supabase ${table}: ${response.status}`);
  return response.json();
}

function normalizeCatalog(categories, rows) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const sectionBySlug = new Map(categories.filter((item) => !item.parent_id).map((item) => [item.slug, item]));
  const staticSections = new Map(FALLBACK_SECTIONS.map((item) => [item.id, item]));
  const sections = categories.filter((item) => !item.parent_id).map((category) => {
    const original = staticSections.get(category.slug) || {};
    const subsections = categories.filter((sub) => sub.parent_id === category.id).map((sub) => {
      const originalSub = original.subsections?.find((item) => item.id === sub.slug) || {};
      return { ...originalSub, id: sub.slug, name: sub.name, dbId: sub.id };
    });
    return { ...original, id: category.slug, name: category.name, dbId: category.id, subsections };
  });

  const fallbackById = new Map(FALLBACK_PRODUCTS.map((item) => [Number(item.id), item]));
  const products = rows.map((row) => {
    const category = categoryById.get(row.category_id);
    const section = category?.parent_id ? categoryById.get(category.parent_id) : null;
    const original = fallbackById.get(Number(row.legacy_id)) || {};
    const metadata = row.metadata || {};
    return {
      ...original,
      id: Number(row.legacy_id) || row.id,
      dbId: row.id,
      section: section?.slug || (category?.parent_id ? "" : category?.slug) || original.section,
      sub: category?.parent_id ? category.slug : original.sub,
      name: row.name,
      desc: row.description || "",
      price: Number(row.price) || 0,
      oldPrice: row.old_price == null ? null : Number(row.old_price),
      image: row.image_url || original.image || "",
      color: row.image_color || original.color || "#eee",
      specs: Array.isArray(row.specs) ? row.specs : original.specs || [],
      sku: row.sku || "",
      stock: Number(row.stock_quantity) || 0,
      priceEstimated: Boolean(metadata.price_estimated ?? original.priceEstimated),
      priceOnRequest: Boolean(metadata.price_on_request ?? original.priceOnRequest),
      active: row.is_active,
    };
  });
  return { sections, products };
}

export function CatalogProvider({ children }) {
  const [catalog, setCatalog] = useState({ sections: FALLBACK_SECTIONS, products: FALLBACK_PRODUCTS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      readTable("categories", "select=id,name,slug,parent_id,sort_order,is_active&is_active=eq.true&order=sort_order.asc"),
      readTable("products", "select=id,legacy_id,category_id,name,slug,description,price,old_price,sku,image_url,image_color,stock_quantity,is_active,specs,metadata&is_active=eq.true&order=legacy_id.asc"),
    ]).then(([categories, products]) => {
      if (!alive) return;
      setCatalog(normalizeCatalog(categories, products));
      setError("");
    }).catch((err) => {
      if (alive) setError("Не вдалося завантажити каталог із бази даних. Показано резервний каталог.");
      console.error("Catalog sync error:", err);
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const value = useMemo(() => ({ ...catalog, loading, error }), [catalog, loading, error]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog має використовуватись усередині CatalogProvider");
  return value;
}
