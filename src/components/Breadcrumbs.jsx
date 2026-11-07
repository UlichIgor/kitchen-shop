import { Link } from "react-router-dom";

/* items: [{ label, to? }] — останній елемент без to = поточна сторінка */
export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Навігаційний ланцюжок">
      <ol>
        <li>
          <Link to="/">Головна</Link>
        </li>
        {items.map((item, i) => (
          <li key={i}>
            {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
