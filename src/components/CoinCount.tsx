// A number that counts up briefly when coins change.
"use client";

import { LIMITS } from "@/config/limits";
import { useEffect, useState } from "react";

/** Eases the movement so it slows near the final value. */
function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/** Shows a coin total, counting up unless the person prefers reduced motion. */
export function CoinCount({ value, from = 0 }: { value: number; from?: number }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (from === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const progress = Math.min((now - start) / LIMITS.coinCountUpMs, 1);
      setShown(Math.round(from + (value - from) * easeOut(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [from, value]);

  return <span className="numeric">{shown}</span>;
}
