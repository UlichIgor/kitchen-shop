import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PRODUCTS, getProduct, getSection, getSub } from "../data/catalog.js";
import { useCart } from "../context/CartContext.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import ProductImage from "../components/ProductImage.jsx";
import ProductCard from "../components/ProductCard.jsx";
import Price from "../components/Price.jsx";
import NotFound from "./NotFound.jsx";

export default function Product() {
  const { id } = useParams();
  const product = getProduct(id);
  const { add, openCart } = useCart();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [id]);

  if (!product) return <NotFound />;

  const section = getSection(product.section);
  const sub = getSub(product.section, product.sub);
  const related = PRODUCTS.filter((p) => p.sub === product.sub && p.id !== product.id).slice(0, 4);

  return (
    <div className="container page">
      <Breadcrumbs
        items={[
          { label: "Каталог", to: "/catalog" },
          { label: section.name, to: `/catalog/${section.id}` },
          { label: sub.name, to: `/catalog/${section.id}/${sub.id}` },
          { label: product.name },
        ]}
      />

      <div className="product">
        <ProductImage product={product} className="product__img" />

        <div className="product__info">
          <span className="card__cat">{sub.name}</span>
          <h1 className="page__title">{product.name}</h1>
          <Price product={product} size="lg" />
          <p className="product__desc">{product.desc}</p>

          {!product.priceOnRequest && <div className="product__buy">
            <div className="qty qty--lg">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Менше">−</button>
              <span>{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Більше">+</button>
            </div>
            <button type="button" className="btn" onClick={() => add(product.id, qty)}>
              Додати в кошик
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                add(product.id, qty);
                openCart();
              }}
            >
              Купити зараз
            </button>
          </div>}

          {product.priceOnRequest && <p className="product__desc">Щоб дізнатися актуальну вартість, зв’яжіться з нами для консультації.</p>}

          {product.specs?.length > 0 && (
            <>
              <h2 className="product__h">Характеристики</h2>
              <table className="specs">
                <tbody>
                  {product.specs.map(([k, v]) => (
                    <tr key={k}>
                      <th>{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2 className="section__title">Схожі товари</h2>
          <div className="grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
