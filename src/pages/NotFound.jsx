import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container page notfound">
      <div className="notfound__icon">🍽️</div>
      <h1 className="page__title">Сторінку не знайдено</h1>
      <p>Можливо, товар більше недоступний або адресу введено з помилкою.</p>
      <Link to="/catalog" className="btn">До каталогу</Link>
    </div>
  );
}
