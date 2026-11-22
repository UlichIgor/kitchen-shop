import { Link } from "react-router-dom";
import { SECTIONS } from "../data/catalog.js";
import { useEffect } from "react";
import { setPageSeo } from "../utils/seo.js";

export default function About() {
  useEffect(() => {
    setPageSeo({
      title: "Про нас — Kitchen Shop",
      description: "Kitchen Shop — онлайн-каталог товарів для дому, ремонту, кухні, дверей і вікон. Дізнайтеся про наш асортимент і зручний спосіб вибору товарів.",
      path: "#/about",
    });
  }, []);

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container about-hero__inner">
          <span className="about-eyebrow">KITCHEN SHOP · ТОВАРИ ДЛЯ ДОМУ</span>
          <h1>Створюємо простір, у якому хочеться жити</h1>
          <p>Все необхідне для затишку, оновлення та облаштування вашого дому — в одному зручному каталозі.</p>
          <Link to="/catalog" className="btn btn--light">Переглянути каталог <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="container about-intro">
        <div className="about-intro__copy">
          <span className="about-kicker">ХТО МИ</span>
          <h2>Kitchen Shop — зручний вибір для вашого дому</h2>
          <p>Ми зібрали в одному онлайн-каталозі товари для різних етапів облаштування оселі: від ремонту та оздоблення до кухонної техніки, посуду, дверей і вікон.</p>
          <p>Наша мета — зробити пошук потрібних речей простішим: зрозумілі категорії, пошук за назвою, детальні картки товарів і можливість скласти власний кошик.</p>
        </div>
        <div className="about-intro__visual" role="img" aria-label="Затишний сучасний інтер'єр дому">
          <div className="about-visual-card">
            <span aria-hidden="true">⌂</span>
            <strong>Дім починається з деталей</strong>
            <small>Ідеї та товари для вашого простору</small>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container">
          <div className="about-section-heading">
            <span className="about-kicker">НАШ ПІДХІД</span>
            <h2>Покупки без зайвих складнощів</h2>
            <p>Продумана структура каталогу допомагає швидше знайти те, що потрібно саме зараз.</p>
          </div>
          <div className="about-value-grid">
            <article className="about-value">
              <span className="about-value__icon" aria-hidden="true">🧭</span>
              <h3>Зрозуміла навігація</h3>
              <p>Товари згруповані за напрямами та підкатегоріями, щоб вам було легше зорієнтуватися.</p>
            </article>
            <article className="about-value">
              <span className="about-value__icon" aria-hidden="true">🔎</span>
              <h3>Зручний пошук</h3>
              <p>Знаходьте потрібні позиції за назвою, переглядайте пропозиції та порівнюйте ціни.</p>
            </article>
            <article className="about-value">
              <span className="about-value__icon" aria-hidden="true">🛒</span>
              <h3>Кошик для вибраного</h3>
              <p>Додавайте товари до кошика та формуйте список покупок у зручному для себе темпі.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="container about-categories">
        <div className="about-section-heading">
          <span className="about-kicker">ЩО Є В КАТАЛОЗІ</span>
          <h2>Рішення для різних куточків оселі</h2>
          <p>Оберіть напрям і перейдіть до товарів, які вас цікавлять.</p>
        </div>
        <div className="about-category-grid">
          {SECTIONS.map((section) => (
            <Link className="about-category" to={`/catalog/${section.id}`} key={section.id}>
              <span aria-hidden="true">{section.emoji}</span>
              <strong>{section.name}</strong>
              <small>{section.desc}</small>
              <b aria-hidden="true">Переглянути →</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <div className="container about-cta__inner">
          <div>
            <span className="about-kicker">ПОЧНІМО З ВАШОЇ ІДЕЇ</span>
            <h2>Знайдіть усе необхідне для свого дому</h2>
            <p>Перегляньте каталог, оберіть товари та додайте їх до кошика.</p>
          </div>
          <Link to="/catalog" className="btn btn--primary">До каталогу <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </div>
  );
}
