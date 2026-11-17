import { useRef } from "react";
import useReveal from "../hooks/useReveal";
import useTilt from "../hooks/useTilt";

/** Category tile: staggered reveal, gentle 3D tilt, slow image drift on hover. */
export default function CategoryCard({ item, index = 0, onSelect }) {
  const ref = useRef(null);
  const visible = useReveal(ref);
  useTilt(ref, { max: 5, glare: false });

  return (
    <button
      ref={ref}
      type="button"
      className={`category-card kf-category kf-reveal${visible ? " kf-in" : ""}`}
      style={{ "--kf-delay": `${index * 90}ms` }}
      onClick={() => onSelect(item)}
    >
      <img src={item.image} alt={item.name} draggable={false} />
      <span className="category-overlay" />
      <span className="category-copy">
        <small>{item.subtitle}</small>
        <strong>{item.name}</strong>
        <span>EXPLORE COLLECTION ↗</span>
      </span>
    </button>
  );
}
