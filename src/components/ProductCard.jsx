import { Link } from "react-router-dom";
import { getSection, getSub } from "../data/catalog.js";
import { useCart } from "../context/CartContext.jsx";
import ProductImage from "./ProductImage.jsx";
import Price from "./Price.jsx";

export default function ProductCard({ product }) {
  const { add } = useCart();
  const section = getSection(product.section);
  const sub = getSub(product.section, product.sub);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <article className="card">
      <Link to={`/product/${product.id}`} className="card__media" aria-label={product.name}>
        <ProductImage product={product} />
        {discount > 0 && <span className="badge">−{discount}%</span>}
      </Link>

      <div className="card__body">
        <span className="card__cat">{sub?.name || section?.name}</span>
        <h3 className="card__title">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="card__desc">{product.desc}</p>

        <div className="card__bottom">
          <Price product={product} />
          {product.priceOnRequest ? (
            <span className="price__unit">Ціну уточнюйте</span>
          ) : (
            <button type="button" className="btn btn--sm" onClick={() => add(product.id)}>
              У кошик
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
