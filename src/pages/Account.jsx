import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../data/catalog.js";
import { setPageSeo } from "../utils/seo.js";

const PROFILE_KEY = "kitchen-shop-profile";
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };

export default function Account() {
  const [profile, setProfile] = useState(() => ({ name: "", phone: "", email: "", ...read(PROFILE_KEY, {}) }));
  const [orders] = useState(() => { const data = read("kitchen-shop-orders", []); return Array.isArray(data) ? [...data].reverse() : []; });
  const [saved, setSaved] = useState(false);
  useEffect(() => { setPageSeo({ title: "Мій кабінет", description: "Особистий кабінет Kitchen Shop: контактні дані та історія замовлень.", path: "#/account" }); }, []);
  const change = (e) => { setProfile((p) => ({ ...p, [e.target.name]: e.target.value })); setSaved(false); };
  const submit = (e) => { e.preventDefault(); try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); setSaved(true); } catch { setSaved(false); } };
  return <div className="container account-page">
    <div className="account-heading"><div><span className="account-kicker">KITCHEN SHOP · ОСОБИСТИЙ ПРОСТІР</span><h1 className="page__title">Мій кабінет</h1><p className="page__lead">Керуйте контактними даними та переглядайте історію замовлень.</p></div><div className="account-avatar" aria-hidden="true">👤</div></div>
    <div className="account-notice"><span>ℹ️</span><p><strong>Демонстраційний кабінет.</strong> Профіль та історія зберігаються лише в цьому браузері. Вони не синхронізуються між пристроями й не надсилаються до магазину.</p></div>
    <div className="account-layout">
      <section className="account-panel"><div className="account-panel__heading"><span>01</span><div><h2>Особисті дані</h2><p>Контактна інформація</p></div></div>
        <form className="account-form" onSubmit={submit}>
          <label className="account-field"><span>Ім’я та прізвище</span><input name="name" value={profile.name} onChange={change} placeholder="Як до вас звертатися?" autoComplete="name" /></label>
          <label className="account-field"><span>Номер телефону</span><input name="phone" type="tel" value={profile.phone} onChange={change} placeholder="+380..." autoComplete="tel" /></label>
          <label className="account-field"><span>Електронна пошта</span><input name="email" type="email" value={profile.email} onChange={change} placeholder="name@example.com" autoComplete="email" /></label>
          <button className="btn" type="submit">Зберегти дані</button>{saved && <p className="account-success" role="status">✓ Дані збережено в цьому браузері.</p>}
        </form>
      </section>
      <section className="account-panel"><div className="account-panel__heading"><span>02</span><div><h2>Мої замовлення</h2><p>Записи, створені на цьому пристрої</p></div></div>
        {orders.length === 0 ? <div className="account-empty"><span>📦</span><h3>Поки що немає замовлень</h3><p>Після оформлення замовлення в цьому браузері воно з’явиться тут.</p><Link to="/catalog" className="btn btn--ghost">Перейти до каталогу</Link></div> :
          <div className="account-order-list">{orders.map((order, i) => <article className="account-order" key={order.id || i}>
            <div className="account-order__top"><strong>{order.id || "Замовлення"}</strong><time>{order.date ? new Date(order.date).toLocaleDateString("uk-UA") : "—"}</time></div>
            <p>{Array.isArray(order.items) ? order.items.map((item) => `${item.name} × ${item.qty}`).join(", ") : "Склад не вказаний"}</p>
            <div className="account-order__bottom"><span className="account-local-status">Локальний запис</span><b>{money(Number(order.total) || 0)}</b></div>
            <small>Запис не підтверджує отримання замовлення магазином.</small>
          </article>)}</div>}
      </section>
    </div>
    <p className="account-back"><Link to="/">← Повернутися на головну</Link></p>
  </div>;
}
