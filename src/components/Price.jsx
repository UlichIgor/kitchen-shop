import { money } from "../data/catalog.js";

export default function Price({ product, size = "md" }) {
  return (
    <span className={`price price--${size}`}>
      <b>{money(product.price)}</b>
      {product.unit && <span className="price__unit"> / {product.unit}</span>}
      {product.oldPrice && <s className="price__old">{money(product.oldPrice)}</s>}
    </span>
  );
}
