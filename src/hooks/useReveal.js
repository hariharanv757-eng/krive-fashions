import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./motion";

/** Returns true once the element has scrolled into view (one-shot). */
export default function useReveal(ref, { threshold = 0.18 } = {}) {
  const [visible, setVisible] = useState(
    () => prefersReducedMotion() || typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, visible]);

  return visible;
}
