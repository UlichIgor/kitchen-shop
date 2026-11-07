import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PRODUCTS, getSection, getSub } from "../data/catalog.js";
import ProductCard from "../components/ProductCard.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import { SECTIONS } from "../data/catalog.js";
import NotFound from "./NotFound.jsx";

export default function Catalog() {
  const { sectionId, subId } = useParams();
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim().toLowerCase();
  const [sort, setSort] = useState("default");
  const [onlySale, setOnlySale] = useState(false);

  const section = sectionId ? getSection(sectionId) : null;
  const sub = section && subId ? getSub(sectionId, subId) : null;

  const products = useMemo(() => {
    let list = PRODUCTS.filter(
      (p) =>
        (!sectionId || p.section === sectionId) &&
        (!subId || p.sub === subId) &&
        (!onlySale || p.oldPrice) &&
        (!query || `${p.name} ${p.desc}`.toLowerCase().includes(query))
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "uk"));
    return list;
  }, [sectionId, subId, query, sort, onlySale]);

  if ((sectionId && !section) || (subId && !sub)) return <NotFound />;

  const crumbs = [{ label: "Каталог", to: section || query ? "/catalog" : undefined }];
  if (section) crumbs.push({ label: section.name, to: sub ? `/catalog/${section.id}` : undefined });
  if (sub) crumbs.push({ label: sub.name });

  const title = query
    ? `Результати пошуку: «${params.get("q")}»`
    : sub?.name || section?.name || "Усі товари";

  return (
    <div className="container page">
      <Breadcrumbs items={crumbs} />
      <div className="catalog">
        <aside className="catalog__side">
          <h2 className="side__title">Розділи</h2>
          <ul className="side__list">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link to={`/catalog/${s.id}`} className={s.id === sectionId ? "active" : ""}>
                  {s.emoji} {s.name}
                </Link>
                {s.id === sectionId && (
                  <ul>
                    {s.subsections.map((sb) => (
                      <li key={sb.id}>
                        <Link to={`/catalog/${s.id}/${sb.id}`} className={sb.id === subId ? "active" : ""}>
                          {sb.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </aside>

        <section className="catalog__main">
          <h1 className="page__title">{title}</h1>
          {section && !sub && <p className="page__lead">{section.desc}</p>}

          <div className="toolbar">
            <span className="toolbar__count">Знайдено: {products.length}</span>
            <label className="check">
              <input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} />
              Лише зі знижкою
            </label>
            <label className="select">
              Сортування:
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="default">За замовчуванням</option>
                <option value="price-asc">Ціна: від нижчої</option>
                <option value="price-desc">Ціна: від вищої</option>
                <option value="name">За назвою</option>
              </select>
            </label>
          </div>

          {products.length ? (
            <div className="grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="empty">Нічого не знайдено. Спробуйте змінити запит або фільтри.</p>
          )}
        </section>
      </div>
    </div>
  );
}
