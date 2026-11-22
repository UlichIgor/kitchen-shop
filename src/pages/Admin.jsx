import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS, SECTIONS, money } from "../data/catalog.js";
import { setPageSeo } from "../utils/seo.js";

function loadOrders() { try { const data = JSON.parse(localStorage.getItem("kitchen-shop-orders") || "[]"); return Array.isArray(data) ? [...data].reverse() : []; } catch { return []; } }

export default function Admin() {
  const [orders] = useState(loadOrders);
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [tab, setTab] = useState("products");
  useEffect(() => { setPageSeo({ title: "Панель адміністратора", description: "Демонстраційна панель керування Kitchen Shop.", path: "#/admin" }); }, []);
  const filtered = useMemo(() => PRODUCTS.filter((p) => p.name.toLocaleLowerCase("uk-UA").includes(query.toLocaleLowerCase("uk-UA")) && (section === "all" || p.section === section)), [query, section]);
  const localTotal = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  return <div className="container admin-page">
    <div className="admin-heading"><div><span className="account-kicker">KITCHEN SHOP · КЕРУВАННЯ</span><h1 className="page__title">Панель адміністратора</h1><p className="page__lead">Огляд каталогу та локальних записів замовлень.</p></div><span className="admin-heading__icon">⚙️</span></div>
    <div className="admin-warning"><strong>Демо-режим — не для реального адміністрування.</strong><p>Сторінка поки не має авторизації та серверної бази даних. Замовлення читаються лише з localStorage цього браузера, а каталог — зі статичного файлу сайту. Не вводьте тут паролі або конфіденційні дані. Для безпечного адміністрування потрібні Supabase Auth, роль адміністратора та серверна база.</p></div>
    <div className="admin-stats">
      <article><span>Товарів у каталозі</span><strong>{PRODUCTS.length}</strong><small>Статичний каталог</small></article>
      <article><span>Категорій</span><strong>{SECTIONS.length}</strong><small>Основні розділи</small></article>
      <article><span>Локальних замовлень</span><strong>{orders.length}</strong><small>Лише цей браузер</small></article>
      <article><span>Сума локальних записів</span><strong>{money(localTotal)}</strong><small>Не підтверджений виторг</small></article>
    </div>
    <div className="admin-tabs" role="tablist" aria-label="Розділи панелі">
      <button type="button" role="tab" aria-selected={tab === "products"} className={tab === "products" ? "is-active" : ""} onClick={() => setTab("products")}>Каталог товарів</button>
      <button type="button" role="tab" aria-selected={tab === "orders"} className={tab === "orders" ? "is-active" : ""} onClick={() => setTab("orders")}>Замовлення ({orders.length})</button>
    </div>
    {tab === "products" ? <section className="admin-panel">
      <div className="admin-panel__head"><div><h2>Каталог товарів</h2><p>Перегляд асортименту без редагування опублікованих даних.</p></div><Link to="/catalog" className="btn btn--ghost btn--sm">Відкрити каталог ↗</Link></div>
      <div className="admin-filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук товару..." aria-label="Пошук товару" /><select value={section} onChange={(e) => setSection(e.target.value)} aria-label="Фільтр категорії"><option value="all">Усі категорії</option>{SECTIONS.map((s) => <option value={s.id} key={s.id}>{s.name}</option>)}</select></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Товар</th><th>Категорія</th><th>Ціна</th><th>Статус</th></tr></thead><tbody>
        {filtered.map((p) => <tr key={p.id}><td><strong>{p.name}</strong><small>ID: {p.id}</small></td><td>{SECTIONS.find((s) => s.id === p.section)?.name || p.section}</td><td><strong>{money(p.price)}</strong>{p.oldPrice && <small className="admin-old-price">Було: {money(p.oldPrice)}</small>}</td><td><span className="admin-static-status">У каталозі</span></td></tr>)}
        {filtered.length === 0 && <tr><td colSpan="4" className="admin-no-results">Нічого не знайдено.</td></tr>}
      </tbody></table></div>
    </section> : <section className="admin-panel">
      <div className="admin-panel__head"><div><h2>Замовлення</h2><p>Локальні записи з цього браузера — не серверні замовлення.</p></div></div>
      {orders.length === 0 ? <div className="account-empty"><span>📭</span><h3>Локальних записів поки немає</h3><p>Тестові замовлення з’являться тут після оформлення в цьому браузері.</p></div> :
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Номер / дата</th><th>Покупець</th><th>Склад</th><th>Сума</th></tr></thead><tbody>
          {orders.map((o, i) => <tr key={o.id || i}><td><strong>{o.id || "—"}</strong><small>{o.date ? new Date(o.date).toLocaleString("uk-UA") : "—"}</small></td><td>{o.customer?.name || "—"}<small>{o.customer?.phone || ""}</small></td><td>{Array.isArray(o.items) ? o.items.map((item) => `${item.name} × ${item.qty}`).join(", ") : "—"}</td><td><strong>{money(Number(o.total) || 0)}</strong><small className="admin-old-price">Локально, не підтверджено</small></td></tr>)}
        </tbody></table></div>}
    </section>}
    <p className="admin-back"><Link to="/">← На головну</Link></p>
  </div>;
}
