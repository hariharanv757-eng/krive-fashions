import { useEffect } from "react";
import { prefersReducedMotion } from "./motion";

/**
 * Pass the element (from a callback ref / state) so the effect re-subscribes
 * if React replaces it. Writes --kf-py (px scrolled, only while the element is on screen) so CSS can
 * translate layers at different speeds. Passive listener + rAF = no jank.
 */
export default function useParallax(el) {
  useEffect(() => {
    if (!el || prefersReducedMotion()) return undefined;
    let frame = 0;

    const paint = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0) return; // scrolled past: stop painting
      // Distance scrolled (never negative) so the layers rest centred at the top.
      // Intended for the hero, which is the first block on the page.
      el.style.setProperty("--kf-py", String(Math.max(0, Math.round(window.scrollY))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [el]);
}
