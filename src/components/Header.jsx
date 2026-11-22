import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SECTIONS } from "../data/catalog.js";
import { useCart } from "../context/CartContext.jsx";
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { count, openCart } = useCart();
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);
  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
    closeMenu();
  };
  return <header className="header">
    <div className="container header__top">
      <button type="button" className="burger" aria-label="Відкрити меню" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}><span /><span /><span /></button>
      <Link to="/" className="logo" onClick={closeMenu} aria-label="Kitchen Shop — на головну">
        <img className="logo__image" src="/kitchen-shop/logo.svg" alt="Kitchen Shop — Все для вашого дому" width="192" height="47" />
      </Link>
      <form className="search" onSubmit={onSearch} role="search">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук: плита, ламінат, сковорідка…" aria-label="Пошук товарів" />
        <button type="submit" aria-label="Шукати">🔍</button>
      </form>
      <Link to="/account" className="account-link" onClick={closeMenu}><span aria-hidden="true">👤</span><span>Мій кабінет</span></Link>
      <button type="button" className="cart-btn" onClick={openCart} aria-label="Відкрити кошик">
        <span aria-hidden="true">🛒</span><span className="cart-btn__label">Кошик</span>{count > 0 && <b className="cart-btn__count">{count}</b>}
      </button>
    </div>
    <nav className={`nav ${menuOpen ? "nav--open" : ""}`} aria-label="Головна навігація">
      <ul className="container nav__list">
        <li className="nav__item"><Link to="/catalog" className="nav__link" onClick={closeMenu}>Усі товари</Link></li>
        <li className="nav__item"><Link to="/sales" className="nav__link nav__link--sale" onClick={closeMenu}>🔥 Акції</Link></li>
        {SECTIONS.map((section) => <li key={section.id} className="nav__item">
          <Link to={`/catalog/${section.id}`} className="nav__link" onClick={closeMenu}><span aria-hidden="true">{section.emoji}</span> {section.name}</Link>
          <ul className="nav__sub">{section.subsections.map((sub) => <li key={sub.id}><Link to={`/catalog/${section.id}/${sub.id}`} onClick={closeMenu}>{sub.name}</Link></li>)}</ul>
        </li>)}
        <li className="nav__item"><Link to="/about" className="nav__link" onClick={closeMenu}>Про нас</Link></li>
        <li className="nav__item account-nav-item"><Link to="/account" className="nav__link" onClick={closeMenu}>👤 Мій кабінет</Link></li>
      </ul>
    </nav>
  </header>;
}
