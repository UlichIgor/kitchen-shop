import { Link } from "react-router-dom";
import { SECTIONS } from "../data/catalog.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <h3 className="footer__title">🏠 Kitchen Shop</h3>
          <p>Онлайн-каталог товарів для дому, ремонту, кухні, дверей та вікон. Допомагаємо зручно зорієнтуватися в асортименті й обрати потрібне.</p>
          <Link className="footer__about-link" to="/about">Дізнатися більше про нас →</Link>
        </div>

        <div>
          <h3 className="footer__title">Каталог</h3>
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link to={`/catalog/${s.id}`}>{s.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="footer__title">Інформація</h3>
          <ul>
            <li><Link to="/about">Про нас</Link></li>
            <li><Link to="/catalog">Усі товари</Link></li>
            <li><Link to="/sales">Акційні пропозиції</Link></li>
          </ul>
          <p className="footer__note">Деталі замовлення та наявність товарів уточнюйте перед покупкою.</p>
        </div>
      </div>
      <div className="container footer__bottom">
        © {new Date().getFullYear()} Kitchen Shop. Усі права захищено.
      </div>
    </footer>
  );
}
