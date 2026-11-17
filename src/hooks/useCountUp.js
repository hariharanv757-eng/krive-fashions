import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./motion";

/** Animates a number from its previous value to `target` (easeOutExpo). */
export default function useCountUp(target, { duration = 1100 } = {}) {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const end = Number(target) || 0;
    const start = fromRef.current;
    const span = prefersReducedMotion() ? 0 : duration;
    const t0 = performance.now();
    let frame = 0;

    const tick = (now) => {
      const t = span === 0 ? 1 : Math.min(1, (now - t0) / span);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const next = start + (end - start) * eased;
      fromRef.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return Math.round(value);
}
