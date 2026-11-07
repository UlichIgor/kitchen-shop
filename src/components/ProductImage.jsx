import { useEffect, useState } from "react";

export default function ProductImage({ product, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = product.image
    ? `${import.meta.env.BASE_URL}${product.image.replace(/^\/+/, "")}`
    : "";

  useEffect(() => {
    setImageFailed(false);
  }, [product.image]);

  return (
    <div className={`pimg ${className}`} style={{ background: product.color || "#eee" }}>
      {imageSrc && !imageFailed ? (
        <img
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="pimg__emoji" role="img" aria-label={product.name}>
          {product.emoji || "📦"}
        </span>
      )}
    </div>
  );
}
