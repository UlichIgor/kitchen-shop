import { Link } from "react-router-dom";
import { SECTIONS } from "../data/catalog.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <h3 className="footer__title">🍳 Все для кухні</h3>
          <p>Матеріали для ремонту, кухонна техніка та посуд — усе для вашої кухні в одному магазині.</p>
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
          <h3 className="footer__title">Контакти</h3>
          <p>Демо-версія магазину. Додайте реальний телефон, email та графік роботи перед запуском.</p>
        </div>
      </div>
      <div className="container footer__bottom">
        © {new Date().getFullYear()} Все для кухні. Усі права захищено.
      </div>
    </footer>
  );
}
