import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../data/catalog.js";
import { setPageSeo } from "../utils/seo.js";
import { adminRequest, clearAdminSession, getAuthUser, signInAdmin, signOutAdmin, signUpAdmin } from "../lib/supabase.js";

const ADMIN_EMAIL = "ulichigor55@gmail.com";
const ORDER_STATUSES = [
  ["pending", "Очікує підтвердження"], ["confirmed", "Підтверджено"], ["processing", "Обробляється"],
  ["shipped", "Відправлено"], ["delivered", "Доставлено"], ["cancelled", "Скасовано"],
];
const formatDate = (value) => value ? new Date(value).toLocaleString("uk-UA") : "—";
const formatError = (error) => error?.message || "Не вдалося виконати запит.";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState("");

  useEffect(() => { setPageSeo({ title: "Адмінпанель Kitchen Shop", description: "Захищене керування замовленнями та товарами Kitchen Shop.", path: "/admin" }); }, []);

  const checkAccess = useCallback(async () => {
    try {
      const currentUser = await getAuthUser();
      if (!currentUser) { setChecking(false); return; }
      if ((currentUser.email || "").toLowerCase() !== ADMIN_EMAIL) {
        await signOutAdmin();
        setError("Ця електронна адреса не має доступу до адмінпанелі.");
        setChecking(false);
        return;
      }
      const roles = await adminRequest(`user_roles?select=role&user_id=eq.${currentUser.id}`);
      if (!roles.some((role) => role.role === "admin")) {
        setError("Email ще не підтверджено або адміністративна роль ще не призначена. Підтвердіть адресу з листа та увійдіть знову.");
        setChecking(false);
        return;
      }
      setUser(currentUser);
      setAuthorized(true);
      setChecking(false);
    } catch (e) {
      clearAdminSession();
      setError(formatError(e));
      setChecking(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const [orderRows, productRows] = await Promise.all([
        adminRequest("orders?select=*&order=created_at.desc&limit=100"),
        adminRequest("products?select=id,legacy_id,name,price,old_price,stock_quantity,is_active,sku&order=name.asc&limit=500"),
      ]);
      setOrders(orderRows);
      setProducts(productRows);
      if (orderRows.length) {
        const ids = orderRows.map((o) => o.id).join(",");
        const orderItems = await adminRequest(`order_items?select=*&order_id=in.(${ids})&order=created_at.asc`);
        setItems(orderItems);
      } else setItems([]);
    } catch (e) { setError(formatError(e)); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => { checkAccess(); }, [checkAccess]);
  useEffect(() => { if (authorized) loadDashboard(); }, [authorized, loadDashboard]);

  const filteredProducts = useMemo(() => products.filter((p) => (p.name || "").toLocaleLowerCase("uk-UA").includes(query.toLocaleLowerCase("uk-UA"))), [products, query]);
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const itemsByOrder = useMemo(() => items.reduce((map, item) => {
    (map[item.order_id] ||= []).push(item);
    return map;
  }, {}), [items]);

  async function handleAuth(event) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setError(`Вхід дозволено лише для ${ADMIN_EMAIL}.`); setBusy(false); return;
    }
    try {
      if (mode === "register") {
        const result = await signUpAdmin(ADMIN_EMAIL, password);
        if (result.access_token) {
          setNotice("Реєстрацію виконано. Перевіряю права доступу…");
          await checkAccess();
        } else {
          setNotice("Майже готово! Відкрийте лист від Supabase та підтвердіть адресу. Після цього поверніться сюди й увійдіть.");
          setMode("login");
        }
      } else {
        await signInAdmin(ADMIN_EMAIL, password);
        setPassword("");
        await checkAccess();
      }
    } catch (e) { setError(formatError(e)); }
    finally { setBusy(false); }
  }

  async function updateOrder(orderId, status) {
    setSaving(orderId); setError("");
    try {
      await adminRequest(`orders?id=eq.${orderId}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ status, updated_at: new Date().toISOString() }) });
      await loadDashboard();
    } catch (e) { setError(formatError(e)); }
    finally { setSaving(""); }
  }

  async function updateProduct(productId, patch) {
    setSaving(productId); setError("");
    try {
      await adminRequest(`products?id=eq.${productId}`, { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) });
      await loadDashboard();
    } catch (e) { setError(formatError(e)); }
    finally { setSaving(""); }
  }

  async function logout() {
    await signOutAdmin(); setAuthorized(false); setUser(null); setOrders([]); setItems([]); setProducts([]);
  }

  if (checking) return <div className="container admin-page"><p>Перевіряємо авторизацію та права адміністратора…</p></div>;

  if (!authorized) return <div className="container admin-page">
    <div className="admin-heading"><div><span className="account-kicker">KITCHEN SHOP · ЗАХИЩЕНИЙ ДОСТУП</span><h1 className="page__title">Адмінпанель</h1><p className="page__lead">Увійдіть, щоб керувати замовленнями та товарами магазину.</p></div><span className="admin-heading__icon">🔐</span></div>
    <section className="admin-auth-card">
      <div className="admin-auth-card__top"><span>АДМІНІСТРАТОР</span><strong>{ADMIN_EMAIL}</strong></div>
      <div className="admin-tabs"><button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setError(""); setNotice(""); }}>Вхід</button><button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setError(""); setNotice(""); }}>Перша реєстрація</button></div>
      <form className="account-form" onSubmit={handleAuth}>
        <label className="account-field"><span>Електронна пошта</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label className="account-field"><span>Пароль {mode === "register" ? "(від 8 символів)" : ""}</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} required /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Зачекайте…" : mode === "register" ? "Створити обліковий запис" : "Увійти в адмінпанель"}</button>
      </form>
      {notice && <p className="admin-message admin-message--success" role="status">{notice}</p>}
      {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
      <p className="admin-auth-hint">Обліковий запис буде отримувати права адміністратора лише після підтвердження саме цієї електронної адреси. Пароль не передається адміністратору сайту.</p>
    </section>
    <p className="admin-back"><Link to="/">← На головну</Link></p>
  </div>;

  return <div className="container admin-page">
    <div className="admin-heading"><div><span className="account-kicker">KITCHEN SHOP · КЕРУВАННЯ</span><h1 className="page__title">Адмінпанель</h1><p className="page__lead">Ви увійшли як {user?.email}.</p></div><div className="admin-heading__actions"><span className="admin-heading__icon">⚙️</span><button className="btn btn--ghost btn--sm" onClick={logout}>Вийти</button></div></div>
    {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
    <div className="admin-stats">
      <article><span>Усього замовлень</span><strong>{orders.length}</strong><small>З бази Supabase</small></article>
      <article><span>Очікують підтвердження</span><strong>{orders.filter((o) => o.status === "pending").length}</strong><small>Потребують уваги</small></article>
      <article><span>Товарів у базі</span><strong>{products.length}</strong><small>Серверний каталог</small></article>
      <article><span>Сума замовлень</span><strong>{money(total)}</strong><small>Усі завантажені замовлення</small></article>
    </div>
    <div className="admin-tabs" role="tablist" aria-label="Розділи адмінпанелі">
      <button type="button" role="tab" aria-selected={tab === "orders"} className={tab === "orders" ? "is-active" : ""} onClick={() => setTab("orders")}>Замовлення ({orders.length})</button>
      <button type="button" role="tab" aria-selected={tab === "products"} className={tab === "products" ? "is-active" : ""} onClick={() => setTab("products")}>Товари ({products.length})</button>
    </div>
    {tab === "orders" ? <section className="admin-panel">
      <div className="admin-panel__head"><div><h2>Замовлення магазину</h2><p>Дані завантажуються безпосередньо з бази даних.</p></div><button className="btn btn--ghost btn--sm" onClick={loadDashboard} disabled={busy}>{busy ? "Оновлення…" : "↻ Оновити"}</button></div>
      {orders.length === 0 ? <div className="account-empty"><span>📭</span><h3>Замовлень поки немає</h3><p>Нові оформлення з сайту з’являтимуться тут автоматично.</p></div> :
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Замовлення</th><th>Покупець</th><th>Склад</th><th>Сума</th><th>Статус</th></tr></thead><tbody>
          {orders.map((order) => <tr key={order.id}><td><strong>№ {order.order_number}</strong><small>{formatDate(order.created_at)}</small><small>{order.id.slice(0, 8)}</small></td><td><strong>{order.customer_name}</strong><small>{order.phone}</small><small>{order.email || "Email не вказано"}</small><small>{order.delivery_address || "Самовивіз / адресу не вказано"}</small></td><td>{(itemsByOrder[order.id] || []).map((item) => <small key={item.id}>{item.product_name} × {item.quantity} — {money(Number(item.line_total))}</small>)}{order.notes && <small>Коментар: {order.notes}</small>}</td><td><strong>{money(Number(order.total))}</strong></td><td><select aria-label={`Статус замовлення ${order.order_number}`} value={order.status} disabled={saving === order.id} onChange={(e) => updateOrder(order.id, e.target.value)}>{ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}
        </tbody></table></div>}
    </section> : <section className="admin-panel">
      <div className="admin-panel__head"><div><h2>Каталог товарів</h2><p>Редагування ціни, залишку та видимості товарів.</p></div></div>
      <div className="admin-filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук товару…" aria-label="Пошук товару" /></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Товар</th><th>Ціна, грн</th><th>Залишок</th><th>Видимість</th><th>Зберегти</th></tr></thead><tbody>
        {filteredProducts.map((product) => <ProductRow key={product.id} product={product} saving={saving === product.id} onSave={updateProduct} />)}
        {filteredProducts.length === 0 && <tr><td colSpan="5" className="admin-no-results">Нічого не знайдено.</td></tr>}
      </tbody></table></div>
    </section>}
    <p className="admin-back"><Link to="/">← На головну</Link></p>
  </div>;
}

function ProductRow({ product, saving, onSave }) {
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [stock, setStock] = useState(String(product.stock_quantity ?? 0));
  const [active, setActive] = useState(Boolean(product.is_active));
  useEffect(() => { setPrice(String(product.price ?? "")); setStock(String(product.stock_quantity ?? 0)); setActive(Boolean(product.is_active)); }, [product]);
  return <tr><td><strong>{product.name}</strong><small>{product.sku || `ID: ${product.legacy_id ?? product.id}`}</small></td>
    <td><input className="admin-cell-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} aria-label={`Ціна ${product.name}`} /></td>
    <td><input className="admin-cell-input" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} aria-label={`Залишок ${product.name}`} /></td>
    <td><label className="admin-toggle"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> {active ? "Активний" : "Прихований"}</label></td>
    <td><button className="btn btn--sm" disabled={saving || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0} onClick={() => onSave(product.id, { price: Number(price), stock_quantity: Number(stock), is_active: active })}>{saving ? "…" : "Зберегти"}</button></td>
  </tr>;
}
