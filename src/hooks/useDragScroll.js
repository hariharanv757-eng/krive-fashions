import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontal carousel behaviour for a native scroll-snap track:
 *  - mouse drag with momentum (touch uses the browser's native swipe),
 *  - arrow paging, keyboard arrows,
 *  - prev/next availability and a progress CSS variable (no per-frame re-render).
 */
export default function useDragScroll(itemCount) {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ canPrev: false, canNext: false });

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const host = el.parentElement;
    if (host) {
      host.style.setProperty("--kf-progress", max > 0 ? String(el.scrollLeft / max) : "0");
      host.style.setProperty("--kf-visible", el.scrollWidth > 0 ? String(el.clientWidth / el.scrollWidth) : "1");
    }
    const canPrev = el.scrollLeft > 4;
    const canNext = el.scrollLeft < max - 4;
    setEdges((prev) => (prev.canPrev === canPrev && prev.canNext === canNext ? prev : { canPrev, canNext }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer?.disconnect();
    };
  }, [sync, itemCount]);

  // Mouse dragging
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let down = false;
    let moved = false;

    const onDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      down = true;
      moved = false;
      startX = lastX = event.clientX;
      startScroll = el.scrollLeft;
      lastT = performance.now();
      velocity = 0;
    };
    const onMove = (event) => {
      if (!down) return;
      const dx = event.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        el.classList.add("is-dragging");
      }
      if (!moved) return;
      const now = performance.now();
      velocity = (event.clientX - lastX) / Math.max(1, now - lastT);
      lastX = event.clientX;
      lastT = now;
      el.scrollLeft = startScroll - dx;
    };
    const swallowClick = (event) => {
      event.stopPropagation();
      event.preventDefault();
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      el.classList.remove("is-dragging");
      // the click that ends a drag must not add-to-bag / open anything
      el.addEventListener("click", swallowClick, { capture: true, once: true });
      setTimeout(() => el.removeEventListener("click", swallowClick, { capture: true }), 60);
      el.scrollBy({ left: -velocity * 260, behavior: "smooth" });
    };
    const onDragStart = (event) => event.preventDefault();

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  const step = useCallback(() => {
    const el = ref.current;
    const first = el?.firstElementChild;
    if (!el || !first) return 0;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    return first.getBoundingClientRect().width + gap;
  }, []);

  const scrollByPage = useCallback(
    (direction) => {
      const el = ref.current;
      const size = step();
      if (!el || !size) return;
      const perPage = Math.max(1, Math.floor(el.clientWidth / size));
      el.scrollBy({ left: direction * perPage * size, behavior: "smooth" });
    },
    [step]
  );

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        ref.current?.scrollBy({ left: step(), behavior: "smooth" });
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        ref.current?.scrollBy({ left: -step(), behavior: "smooth" });
      }
    },
    [step]
  );

  return { ref, ...edges, scrollByPage, onKeyDown };
}
