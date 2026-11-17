 import { useRef, useState } from "react";
import useTilt from "../hooks/useTilt";

const SIZES = ["S", "M", "L", "XL"];

/** Product card with mouse-follow 3D tilt, size selector, and live stock status. */
export default function ProductCard({ product, priceLabel, onAdd }) {
  const ref = useRef(null);
  useTilt(ref, { max: 7 });

  const isSaree = product.category === "Sarees";
  const [selectedSize, setSelectedSize] = useState(isSaree ? "Free Size" : "M");

  const hasStockField = product.stock !== undefined && product.stock !== null;
  const outOfStock = hasStockField && Number(product.stock) <= 0;
  const lowStock = hasStockField && Number(product.stock) > 0 && Number(product.stock) <= 5;

  return (
    <article className="product-card kf-card" ref={ref}>
      <div className="product-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
          draggable={false}
          style={outOfStock ? { filter: "grayscale(0.75)", opacity: 0.75 } : undefined}
        />
        {outOfStock ? (
          <span className="product-label" style={{ background: "#984d42", color: "#fff" }}>
            SOLD OUT
          </span>
        ) : lowStock ? (
          <span className="product-label" style={{ background: "#282620", color: "#f4d6a6" }}>
            ONLY {product.stock} LEFT
          </span>
        ) : (
          product.label && <span className="product-label">{product.label}</span>
        )}

        
      </div>

      <div className="product-info" style={{ flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "flex-start" }}>
          <div>
            <h3>{product.name}</h3>
            <p>{product.category}</p>
          </div>
          <strong>{priceLabel}</strong>
        </div>

        {/* Size Selector Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
          <span style={{ fontSize: "9px", letterSpacing: "1px", opacity: 0.7, marginRight: "4px" }}>
            SIZE:
          </span>
          {isSaree ? (
            <span
              style={{
                fontSize: "9px",
                padding: "3px 8px",
                border: "1px solid rgba(165, 139, 98, 0.45)",
                letterSpacing: "0.8px",
              }}
            >
              FREE SIZE
            </span>
          ) : (
            SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                style={{
                  width: "26px",
                  height: "24px",
                  fontSize: "9px",
                  fontWeight: 600,
                  border: "1px solid rgba(165, 139, 98, 0.45)",
                  background: selectedSize === sz ? "#a58b62" : "transparent",
                  color: selectedSize === sz ? "#fff" : "inherit",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {sz}
              </button>
            ))
          )}
       </div>

        <button
          type="button"
          disabled={outOfStock}
          onClick={(e) => {
            e.stopPropagation();
            if (!outOfStock && onAdd) {
              onAdd({ ...product, chosenSize: selectedSize, size: selectedSize }, selectedSize);
            }
          }}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "11px 14px",
            background: outOfStock ? "#555" : "#d9bb82",
            color: outOfStock ? "#aaa" : "#141311",
            border: "1px solid #d9bb82",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            cursor: outOfStock ? "not-allowed" : "pointer",
            position: "relative",
            zIndex: 50,
          }}
        >
          {outOfStock ? "SOLD OUT" : "+ ADD TO BAG"}
        </button>
      </div>
      <span className="kf-glare" aria-hidden="true" style={{ pointerEvents: "none" }} />
    </article>
  );
}