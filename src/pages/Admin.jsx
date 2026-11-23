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
  const [categories, setCategories] = useState([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", slug: "", description: "", price: "", old_price: "", sku: "", image_url: "", category_id: "", stock_quantity: "0" });
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", parent_id: "" });
  const [query, setQuery] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderDateFilter, setOrderDateFilter] = useState("all");
  const [showFilterSettings, setShowFilterSettings] = useState(false);
  const [activeOrderFilters, setActiveOrderFilters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("kitchen-shop-order-filters"));
      return Array.isArray(saved) ? saved : ["search", "status", "date"];
    } catch { return ["search", "status", "date"]; }
  });
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
      const [orderRows, productRows, categoryRows] = await Promise.all([
        adminRequest("orders?select=*&order=created_at.desc&limit=100"),
        adminRequest("products?select=id,legacy_id,name,price,old_price,stock_quantity,is_active,sku,description,image_url,category_id&order=name.asc&limit=500"),
        adminRequest("categories?select=id,name,slug,parent_id,sort_order,is_active&order=sort_order.asc,name.asc"),
      ]);
      setOrders(orderRows);
      setProducts(productRows);
      setCategories(categoryRows);
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
  const filteredOrders = useMemo(() => {
    const term = orderSearch.trim().toLocaleLowerCase("uk-UA");
    const now = new Date();
    return orders.filter((order) => {
      if (activeOrderFilters.includes("search") && term) {
        const haystack = [order.order_number, order.customer_name, order.phone, order.email, order.delivery_address]
          .filter(Boolean).join(" ").toLocaleLowerCase("uk-UA");
        if (!haystack.includes(term)) return false;
      }
      if (activeOrderFilters.includes("status") && orderStatusFilter !== "all" && order.status !== orderStatusFilter) return false;
      if (activeOrderFilters.includes("date") && orderDateFilter !== "all") {
        const created = new Date(order.created_at);
        const days = orderDateFilter === "today" ? 0 : Number(orderDateFilter);
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        if (days === 0) {
          if (created < start) return false;
        } else {
          start.setDate(start.getDate() - days + 1);
          if (created < start) return false;
        }
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter, orderDateFilter, activeOrderFilters]);
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

  function toggleOrderFilter(filter) {
    setActiveOrderFilters((current) => {
      const next = current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter];
      localStorage.setItem("kitchen-shop-order-filters", JSON.stringify(next));
      return next;
    });
  }
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

  async function createProduct(event) {
    event.preventDefault(); setSaving("new-product"); setError(""); setNotice("");
    try {
      if (!newProduct.name.trim() || !newProduct.category_id || Number(newProduct.price) < 0 || !Number.isFinite(Number(newProduct.price))) throw new Error("Заповніть назву, категорію та коректну ціну.");
      const payload = { name: newProduct.name.trim(), slug: newProduct.slug.trim() || slugify(newProduct.name), description: newProduct.description.trim(), price: Number(newProduct.price), old_price: newProduct.old_price === "" ? null : Number(newProduct.old_price), sku: newProduct.sku.trim() || null, image_url: newProduct.image_url.trim() || null, category_id: newProduct.category_id, stock_quantity: Math.max(0, Number.parseInt(newProduct.stock_quantity, 10) || 0), is_active: true, specs: [], metadata: {} };
      await adminRequest("products", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
      setNewProduct({ name: "", slug: "", description: "", price: "", old_price: "", sku: "", image_url: "", category_id: "", stock_quantity: "0" });
      setShowProductForm(false); setNotice("Товар додано до каталогу."); await loadDashboard();
    } catch (e) { setError(formatError(e)); } finally { setSaving(""); }
  }

  async function createCategory(event) {
    event.preventDefault(); setSaving("new-category"); setError(""); setNotice("");
    try {
      const name = newCategory.name.trim();
      if (!name) throw new Error("Вкажіть назву категорії.");
      await adminRequest("categories", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ name, slug: newCategory.slug.trim() || slugify(name), parent_id: newCategory.parent_id || null, sort_order: categories.length + 1, is_active: true }) });
      setNewCategory({ name: "", slug: "", parent_id: "" }); setNotice("Категорію створено."); await loadDashboard();
    } catch (e) { setError(formatError(e)); } finally { setSaving(""); }
  }

  async function updateCategory(categoryId, patch) {
    setSaving(categoryId); setError("");
    try { await adminRequest(`categories?id=eq.${categoryId}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) }); await loadDashboard(); }
    catch (e) { setError(formatError(e)); } finally { setSaving(""); }
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
      <button type="button" role="tab" aria-selected={tab === "categories"} className={tab === "categories" ? "is-active" : ""} onClick={() => setTab("categories")}>Категорії ({categories.length})</button>
    </div>
    {notice && <p className="admin-message admin-message--success" role="status">{notice}</p>}
    {tab === "orders" ? <section className="admin-panel">
      <div className="admin-panel__head"><div><h2>Замовлення магазину</h2><p>Дані завантажуються безпосередньо з бази даних.</p></div><button className="btn btn--ghost btn--sm" onClick={loadDashboard} disabled={busy}>{busy ? "Оновлення…" : "↻ Оновити"}</button></div>
      <div className="admin-order-filter-tools">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowFilterSettings((value) => !value)}>{showFilterSettings ? "Закрити налаштування фільтрів" : "⚙ Налаштувати фільтри"}</button>
        {showFilterSettings && <div className="admin-filter-settings"><strong>Показувати фільтри</strong>
          {[[ "search", "Пошук" ], [ "status", "Статус" ], [ "date", "Дата" ]].map(([key, label]) => <label key={key}><input type="checkbox" checked={activeOrderFilters.includes(key)} onChange={() => toggleOrderFilter(key)} />{label}</label>)}
          <small>Вимкнений пункт можна будь-коли повернути тут.</small>
        </div>}
      </div>
      <div className="admin-filters">
        {activeOrderFilters.includes("search") && <input value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="№ замовлення, клієнт, телефон…" aria-label="Пошук замовлень" />}
        {activeOrderFilters.includes("status") && <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} aria-label="Фільтр за статусом"><option value="all">Усі статуси</option>{ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
        {activeOrderFilters.includes("date") && <select value={orderDateFilter} onChange={(e) => setOrderDateFilter(e.target.value)} aria-label="Фільтр за датою"><option value="all">За весь час</option><option value="today">Сьогодні</option><option value="7">Останні 7 днів</option><option value="30">Останні 30 днів</option></select>}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setOrderSearch(""); setOrderStatusFilter("all"); setOrderDateFilter("all"); }}>Скинути</button>
      </div>
      {orders.length === 0 ? <div className="account-empty"><span>📭</span><h3>Замовлень поки немає</h3><p>Нові оформлення з сайту з’являтимуться тут автоматично.</p></div> :
        filteredOrders.length === 0 ? <div className="admin-no-results">За вибраними фільтрами замовлень не знайдено.</div> :
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Замовлення</th><th>Покупець</th><th>Склад</th><th>Сума</th><th>Статус</th></tr></thead><tbody>
          {filteredOrders.map((order) => <tr key={order.id}><td><strong>№ {order.order_number}</strong><small>{formatDate(order.created_at)}</small><small>{order.id.slice(0, 8)}</small></td><td><strong>{order.customer_name}</strong><small>{order.phone}</small><small>{order.email || "Email не вказано"}</small><small>{order.delivery_address || "Самовивіз / адресу не вказано"}</small></td><td>{(itemsByOrder[order.id] || []).map((item) => <small key={item.id}>{item.product_name} × {item.quantity} — {money(Number(item.line_total))}</small>)}{order.notes && <small>Коментар: {order.notes}</small>}</td><td><strong>{money(Number(order.total))}</strong></td><td><select aria-label={`Статус замовлення ${order.order_number}`} value={order.status} disabled={saving === order.id} onChange={(e) => updateOrder(order.id, e.target.value)}>{ORDER_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td></tr>)}
        </tbody></table></div>}
    </section> : tab === "products" ? <section className="admin-panel">
      <div className="admin-panel__head"><div><h2>Каталог товарів</h2><p>Створення товарів і редагування ціни, залишку та видимості.</p></div><button className="btn btn--sm" onClick={() => setShowProductForm((value) => !value)}>{showProductForm ? "Закрити форму" : "+ Додати товар"}</button></div>
      {showProductForm && <form className="admin-editor" onSubmit={createProduct}>
        <label>Назва товару<input required value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))} /></label>
        <label>Slug<input value={newProduct.slug} onChange={(e) => setNewProduct((p) => ({ ...p, slug: e.target.value }))} /></label>
        <label>Категорія<select required value={newProduct.category_id} onChange={(e) => setNewProduct((p) => ({ ...p, category_id: e.target.value }))}><option value="">Оберіть категорію</option>{categories.filter((cat) => cat.is_active).map((cat) => <option key={cat.id} value={cat.id}>{cat.parent_id ? "— " : ""}{cat.name}</option>)}</select></label>
        <label>Ціна, грн<input required type="number" min="0" step="0.01" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} /></label>
        <label>Стара ціна, грн<input type="number" min="0" step="0.01" value={newProduct.old_price} onChange={(e) => setNewProduct((p) => ({ ...p, old_price: e.target.value }))} /></label>
        <label>Залишок<input type="number" min="0" step="1" value={newProduct.stock_quantity} onChange={(e) => setNewProduct((p) => ({ ...p, stock_quantity: e.target.value }))} /></label>
        <label>Артикул<input value={newProduct.sku} onChange={(e) => setNewProduct((p) => ({ ...p, sku: e.target.value }))} /></label>
        <label>URL зображення<input type="url" placeholder="https://…" value={newProduct.image_url} onChange={(e) => setNewProduct((p) => ({ ...p, image_url: e.target.value }))} /></label>
        <label className="admin-editor__wide">Опис<textarea rows="3" value={newProduct.description} onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))} /></label>
        <button className="btn" type="submit" disabled={saving === "new-product"}>{saving === "new-product" ? "Додавання…" : "Зберегти товар"}</button>
      </form>}
      <div className="admin-filters"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук товару…" aria-label="Пошук товару" /></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Товар</th><th>Ціна, грн</th><th>Залишок</th><th>Видимість</th><th>Зберегти</th></tr></thead><tbody>
        {filteredProducts.map((product) => <ProductRow key={product.id} product={product} saving={saving === product.id} onSave={updateProduct} />)}
        {filteredProducts.length === 0 && <tr><td colSpan="5" className="admin-no-results">Нічого не знайдено.</td></tr>}
      </tbody></table></div>
    </section> : <section className="admin-panel">
      <div className="admin-panel__head"><div><h2>Категорії каталогу</h2><p>Створення, перейменування та приховування категорій.</p></div></div>
      <form className="admin-editor admin-editor--category" onSubmit={createCategory}>
        <label>Назва категорії<input required value={newCategory.name} onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))} /></label>
        <label>Slug<input value={newCategory.slug} onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))} /></label>
        <label>Батьківська категорія<select value={newCategory.parent_id} onChange={(e) => setNewCategory((p) => ({ ...p, parent_id: e.target.value }))}><option value="">Головна категорія</option>{categories.filter((cat) => !cat.parent_id).map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></label>
        <button className="btn" type="submit" disabled={saving === "new-category"}>{saving === "new-category" ? "Створення…" : "+ Додати категорію"}</button>
      </form>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Категорія</th><th>Slug</th><th>Тип</th><th>Видимість</th><th>Дія</th></tr></thead><tbody>{categories.map((cat) => <CategoryRow key={cat.id} category={cat} saving={saving === cat.id} onSave={updateCategory} />)}</tbody></table></div>
    </section>}
    <p className="admin-back"><Link to="/">← На головну</Link></p>
  </div>;
}

function slugify(value) {
  const map = { а:"a", б:"b", в:"v", г:"h", ґ:"g", д:"d", е:"e", є:"ye", ж:"zh", з:"z", и:"y", і:"i", ї:"yi", й:"y", к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r", с:"s", т:"t", у:"u", ф:"f", х:"kh", ц:"ts", ч:"ch", ш:"sh", щ:"shch", ю:"yu", я:"ya", ь:"", ъ:"", ё:"yo", э:"e" };
  return String(value).toLowerCase().split("").map((ch) => map[ch] ?? ch).join("").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoryRow({ category, saving, onSave }) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [active, setActive] = useState(category.is_active);
  useEffect(() => { setName(category.name); setSlug(category.slug); setActive(category.is_active); }, [category]);
  return <tr><td><input className="admin-cell-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Назва категорії" /></td><td><input className="admin-cell-input" value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Slug категорії" /></td><td>{category.parent_id ? "Підкатегорія" : "Основна"}</td><td><label className="admin-toggle"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />{active ? "Активна" : "Прихована"}</label></td><td><button className="btn btn--sm" disabled={saving || !name.trim() || !slug.trim()} onClick={() => onSave(category.id, { name: name.trim(), slug: slug.trim(), is_active: active })}>{saving ? "…" : "Зберегти"}</button></td></tr>;
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
