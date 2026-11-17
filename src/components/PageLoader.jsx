import { useEffect, useState } from "react";

/**
 * Opening curtain. It stays until the hero image and web fonts have really
 * loaded (with a 3.5 s safety cap) and for at least 1.5 s so the animation can
 * be read. The gold line is an indeterminate shimmer — it does not pretend to
 * be a percentage.
 */
export default function PageLoader({ imageSrc }) {
  const [phase, setPhase] = useState("show"); // show -> hide -> gone

  useEffect(() => {
    const timers = [];
    const started = performance.now();
    let alive = true;

    const imageReady = new Promise((resolve) => {
      if (!imageSrc) return resolve();
      const img = new Image();
      img.onload = img.onerror = () => resolve();
      img.src = imageSrc;
    });
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const safetyCap = new Promise((resolve) => timers.push(setTimeout(resolve, 3500)));

    Promise.race([Promise.all([imageReady, fontsReady]), safetyCap]).then(() => {
      const wait = Math.max(0, 1500 - (performance.now() - started));
      timers.push(
        setTimeout(() => {
          if (!alive) return;
          setPhase("hide");
          timers.push(setTimeout(() => alive && setPhase("gone"), 800));
        }, wait)
      );
    });

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [imageSrc]);

  if (phase === "gone") return null;

  return (
    <div
      className={`kf-loader${phase === "hide" ? " is-hiding" : ""}`}
      role="status"
      aria-label="Loading KRIVE FASHIONS"
    >
      <div className="kf-loader-mark">
        <span className="kf-loader-name">KRIVE</span>
        <span className="kf-loader-sub">FASHIONS</span>
      </div>
      <div className="kf-loader-line" aria-hidden="true">
        <i />
      </div>
    </div>
  );
}
