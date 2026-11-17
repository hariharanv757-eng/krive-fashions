import { useEffect } from "react";
import { hasFinePointer, prefersReducedMotion } from "./motion";

/**
 * 3D tilt that follows the mouse. Writes CSS variables (--kf-rx, --kf-ry,
 * --kf-gx, --kf-gy) on the element via requestAnimationFrame, so React never
 * re-renders while you move the mouse and the browser only animates transforms.
 * Does nothing on touch devices or when the user prefers reduced motion.
 */
export default function useTilt(ref, { max = 8, glare = true } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return undefined;

    let frame = 0;
    let nx = 0.5;
    let ny = 0.5;

    const paint = () => {
      frame = 0;
      el.style.setProperty("--kf-ry", `${((nx - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty("--kf-rx", `${((0.5 - ny) * 2 * max).toFixed(2)}deg`);
      if (glare) {
        el.style.setProperty("--kf-gx", `${(nx * 100).toFixed(1)}%`);
        el.style.setProperty("--kf-gy", `${(ny * 100).toFixed(1)}%`);
      }
    };

    const onMove = (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      nx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      ny = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      el.classList.add("is-tilting");
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.classList.remove("is-tilting");
      el.style.setProperty("--kf-rx", "0deg");
      el.style.setProperty("--kf-ry", "0deg");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, max, glare]);
}
