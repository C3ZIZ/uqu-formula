// A loading sign shaped like a race's five start lights, which come on one after another.
import type { CSSProperties } from "react";

const LIGHTS = [0, 1, 2, 3, 4];

/** Draws the lights. The animation is decoration, so the nearby text carries the meaning. */
export function StartLights() {
  return (
    <span className="start-lights" aria-hidden="true">
      {LIGHTS.map((light) => (
        <span key={light} className="start-light" style={{ "--light": light } as CSSProperties} />
      ))}
    </span>
  );
}
