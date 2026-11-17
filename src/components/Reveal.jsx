import { useRef } from "react";
import useReveal from "../hooks/useReveal";

/** Wraps any element so it eases in once, when first scrolled into view. */
export default function Reveal({ as: Tag = "div", className = "", delay = 0, style, children, ...rest }) {
  const ref = useRef(null);
  const visible = useReveal(ref);
  return (
    <Tag
      ref={ref}
      className={`kf-reveal${visible ? " kf-in" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--kf-delay": `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
