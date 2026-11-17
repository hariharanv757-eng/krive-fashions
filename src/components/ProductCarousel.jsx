import { Children } from "react";
import useDragScroll from "../hooks/useDragScroll";

/**
 * Horizontal scroll-snap carousel. Mouse drag, touch swipe, keyboard arrows and
 * prev/next buttons all drive the same native scroller.
 */
export default function ProductCarousel({ children, label = "Products" }) {
  const items = Children.toArray(children);
  const { ref, canPrev, canNext, scrollByPage, onKeyDown } = useDragScroll(items.length);

  return (
    <div className="kf-carousel" role="region" aria-roledescription="carousel" aria-label={label}>
      <ul className="kf-carousel-track" ref={ref} tabIndex={0} onKeyDown={onKeyDown} aria-label={`${label}, scroll horizontally`}>
        {items.map((child) => (
          <li className="kf-carousel-item" key={child.key}>
            {child}
          </li>
        ))}
      </ul>

      <div className="kf-carousel-controls">
        <div className="kf-carousel-bar" aria-hidden="true">
          <i />
        </div>
        <div className="kf-carousel-arrows">
          <button type="button" className="kf-arrow" onClick={() => scrollByPage(-1)} disabled={!canPrev} aria-label="Previous products">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <button type="button" className="kf-arrow" onClick={() => scrollByPage(1)} disabled={!canNext} aria-label="Next products">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
