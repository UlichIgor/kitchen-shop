import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../data/catalog.js";
import { setPageSeo } from "../utils/seo.js";
import { adminRequest, getAuthUser, signInAdmin, signOutAdmin, signUpAdmin } from "../lib/supabase.js";

const formatError = (error) => error?.message || "Не вдалося виконати запит.";
const formatDate = (value) => value ? new Date(value).toLocaleString("uk-UA") : "—";
const ORDER_STATUS_LABELS = { pending: "Очікує підтвердження", confirmed: "Підтверджено", processing: "Обробляється", shipped: "Відправлено", delivered: "Доставлено", cancelled: "Скасовано" };

export default function Account() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { setPageSeo({ title: "Мій кабінет", description: "Особистий кабінет Kitchen Shop: контактні дані та історія замовлень.", path: "/account" }); }, []);

  const loadAccount = useCallback(async (currentUser) => {
    setLoading(true);
    try {
      const [profiles, ownOrders] = await Promise.all([
        adminRequest(`profiles?select=display_name,phone&id=eq.${currentUser.id}`),
        adminRequest("orders?select=*&order=created_at.desc&limit=50"),
      ]);
      setProfile({ name: profiles[0]?.display_name || currentUser.user_metadata?.full_name || "", phone: profiles[0]?.phone || "" });
      setOrders(ownOrders);
      if (ownOrders.length) {
        const ids = ownOrders.map((order) => order.id).join(",");
        setOrderItems(await adminRequest(`order_items?select=*&order_id=in.(${ids})&order=created_at.asc`));
      } else setOrderItems([]);
    } catch (err) { setError(formatError(err)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let alive = true;
    getAuthUser().then(async (currentUser) => {
      if (!alive) return;
      setUser(currentUser);
      if (currentUser) await loadAccount(currentUser);
      else setLoading(false);
    }).catch((err) => { if (alive) { setError(formatError(err)); setLoading(false); } });
    return () => { alive = false; };
  }, [loadAccount]);

  async function authenticate(event) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "register") {
        const result = await signUpAdmin(email.trim(), password);
        if (!result.access_token) {
          setNotice("Ми надіслали лист для підтвердження адреси. Підтвердіть email, а потім увійдіть.");
          setMode("login");
        } else {
          const currentUser = await getAuthUser();
          setUser(currentUser);
          if (currentUser) await loadAccount(currentUser);
        }
      } else {
        await signInAdmin(email.trim(), password);
        const currentUser = await getAuthUser();
        setUser(currentUser);
        if (currentUser) await loadAccount(currentUser);
        setPassword("");
      }
    } catch (err) { setError(formatError(err)); }
    finally { setBusy(false); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!user) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      await adminRequest(`profiles?id=eq.${user.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ display_name: profile.name.trim(), phone: profile.phone.trim(), updated_at: new Date().toISOString() }),
      });
      setSaved(true);
    } catch (err) { setError(formatError(err)); }
    finally { setBusy(false); }
  }

  async function cancelOrder(order) {
    if (!window.confirm(`Скасувати замовлення №${order.order_number}? Цю дію буде передано менеджеру магазину.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await adminRequest("rpc/cancel_my_order", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ p_order_id: order.id }),
      });
      setNotice(`Замовлення №${order.order_number} скасовано.`);
      await loadAccount(user);
    } catch (err) {
      const message = err?.message || "";
      setError(message.includes("ORDER_CANNOT_BE_CANCELLED")
        ? "Це замовлення вже передано в обробку, тому скасувати його через кабінет не можна. Зверніться до менеджера."
        : message.includes("ORDER_NOT_FOUND")
          ? "Замовлення не знайдено або воно не належить цьому акаунту."
          : formatError(err));
    } finally { setBusy(false); }
  }

  async function logout() {
    await signOutAdmin();
    setUser(null); setOrders([]); setOrderItems([]); setProfile({ name: "", phone: "" });
  }

  const itemsByOrder = orderItems.reduce((map, item) => {
    (map[item.order_id] ||= []).push(item);
    return map;
  }, {});

  if (loading) return <div className="container account-page"><p>Завантажуємо особистий кабінет…</p></div>;

  return <div className="container account-page">
    <div className="account-heading"><div><span className="account-kicker">KITCHEN SHOP · ОСОБИСТИЙ ПРОСТІР</span><h1 className="page__title">Мій кабінет</h1><p className="page__lead">Ваші дані та історія замовлень синхронізуються з базою магазину.</p></div><div className="account-avatar" aria-hidden="true">👤</div></div>
    {!user ? <section className="account-panel">
      <div className="account-panel__heading"><span>01</span><div><h2>{mode === "login" ? "Вхід до кабінету" : "Створення облікового запису"}</h2><p>Профіль та історія замовлень будуть доступні після входу.</p></div></div>
      <form className="account-form" onSubmit={authenticate}>
        <label className="account-field"><span>Електронна пошта</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label className="account-field"><span>Пароль (від 8 символів)</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>
        <button className="btn" type="submit" disabled={busy}>{busy ? "Зачекайте…" : mode === "login" ? "Увійти" : "Зареєструватися"}</button>
      </form>
      <p className="account-back"><button type="button" className="btn btn--ghost btn--sm" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); setNotice(""); }}>{mode === "login" ? "Створити обліковий запис" : "Уже є обліковий запис? Увійти"}</button></p>
    </section> : <>
      <div className="account-notice"><span>✓</span><p><strong>{user.email}</strong><br />Ви увійшли. Зміни профілю зберігатимуться у Supabase.</p><button type="button" className="btn btn--ghost btn--sm" onClick={logout}>Вийти</button></div>
      <div className="account-layout">
        <section className="account-panel"><div className="account-panel__heading"><span>01</span><div><h2>Особисті дані</h2><p>Контактна інформація</p></div></div>
          <form className="account-form" onSubmit={saveProfile}>
            <label className="account-field"><span>Ім’я та прізвище</span><input value={profile.name} onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setSaved(false); }} placeholder="Як до вас звертатися?" autoComplete="name" /></label>
            <label className="account-field"><span>Номер телефону</span><input type="tel" value={profile.phone} onChange={(e) => { setProfile((p) => ({ ...p, phone: e.target.value })); setSaved(false); }} placeholder="+380..." autoComplete="tel" /></label>
            <label className="account-field"><span>Електронна пошта</span><input type="email" value={user.email || ""} disabled /></label>
            <button className="btn" type="submit" disabled={busy}>{busy ? "Збереження…" : "Зберегти дані"}</button>
            {saved && <p className="account-success" role="status">✓ Дані збережено в Supabase.</p>}
          </form>
        </section>
        <section className="account-panel"><div className="account-panel__heading"><span>02</span><div><h2>Мої замовлення</h2><p>Замовлення, оформлені під час авторизації</p></div></div>
          {orders.length === 0 ? <div className="account-empty"><span>📦</span><h3>Поки що немає замовлень</h3><p>Замовлення, пов’язані з вашим обліковим записом, з’являться тут.</p><Link to="/catalog" className="btn btn--ghost">Перейти до каталогу</Link></div> :
            <div className="account-order-list">{orders.map((order) => <article className="account-order" key={order.id}>
              <div className="account-order__top"><strong>№ {order.order_number}</strong><time>{formatDate(order.created_at)}</time></div>
              {(itemsByOrder[order.id] || []).map((item) => <p key={item.id}>{item.product_name} × {item.quantity} — {money(Number(item.line_total))}</p>)}
              <div className="account-order__bottom"><span className="account-local-status">{ORDER_STATUS_LABELS[order.status] || order.status}</span><b>{money(Number(order.total))}</b></div>
              {["pending", "confirmed"].includes(order.status) && <button type="button" className="btn btn--ghost btn--sm account-order__cancel" disabled={busy} onClick={() => cancelOrder(order)}>{busy ? "Зачекайте…" : "Скасувати замовлення"}</button>}
            </article>)}</div>}
        </section>
      </div>
    </>}
    {notice && <p className="admin-message admin-message--success" role="status">{notice}</p>}
    {error && <p className="admin-message admin-message--error" role="alert">{error}</p>}
    <p className="account-back"><Link to="/">← Повернутися на головну</Link></p>
  </div>;
}
