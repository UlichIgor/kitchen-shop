import { Link } from "react-router-dom";
import { PRODUCTS, SECTIONS } from "../data/catalog.js";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const sale = PRODUCTS.filter((p) => p.oldPrice).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <h1>Товари для дому — від ремонту до дверей і вікон</h1>
          <p>
            Матеріали для ремонту, кухонна техніка, посуд, двері та вікна для будинку й квартири.
            Обирайте потрібне у каталозі та додавайте товари до кошика.
          </p>
          <Link to="/catalog" className="btn btn--light">Перейти до каталогу</Link>
        </div>
      </section>

      <section className="container section">
        <h2 className="section__title">Розділи магазину</h2>
        <div className="sections">
          {SECTIONS.map((s) => (
            <article className="sec-card" key={s.id}>
              <Link to={`/catalog/${s.id}`} className="sec-card__head">
                <span className="sec-card__emoji" aria-hidden="true">{s.emoji}</span>
                <h3>{s.name}</h3>
                <p>{s.desc}</p>
              </Link>
              <ul className="sec-card__list">
                {s.subsections.map((sub) => (
                  <li key={sub.id}>
                    <Link to={`/catalog/${s.id}/${sub.id}`}>
                      <span aria-hidden="true">{sub.emoji}</span> {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {sale.length > 0 && (
        <section className="container section">
          <h2 className="section__title">Вигідні пропозиції</h2>
          <div className="grid">
            {sale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="container section perks">
        <div className="perk"><span>🧭</span><b>Зручний каталог</b><p>Розділи та підрозділи допоможуть знайти потрібний товар.</p></div>
        <div className="perk"><span>🔎</span><b>Пошук і фільтри</b><p>Шукайте товари, сортуйте їх за ціною та переглядайте акції.</p></div>
        <div className="perk"><span>🛒</span><b>Кошик</b><p>Вибрані товари зберігаються у вашому браузері.</p></div>
        <div className="perk"><span>ℹ️</span><b>Демо-магазин</b><p>Контакти й умови продажу потрібно налаштувати перед запуском.</p></div>
      </section>
    </>
  );
}
