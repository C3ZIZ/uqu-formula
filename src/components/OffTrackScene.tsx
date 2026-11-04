// The not-found scene: a Formula car misses the bend, skids into the gravel, and stops in a dust cloud.
import { ASSET_PATHS } from "@/config/routes";

const LOOP = "6s";
// The car's route: along the straight, then straight on where the track bends away.
const CAR_ROUTE = "M-50 196 H150 C190 196 226 202 262 224";
const SKID_LEFT = "M176 191 C206 195 236 204 258 216";
const SKID_RIGHT = "M172 207 C202 208 226 220 250 232";
const TRACK = "M-20 196 H150 C214 196 252 164 266 112 C276 74 308 44 380 36";
const DUST: { cx: number; cy: number; size: number; delay: string }[] = [
  { cx: 268, cy: 226, size: 26, delay: "0.38" },
  { cx: 248, cy: 216, size: 20, delay: "0.34" },
  { cx: 284, cy: 208, size: 18, delay: "0.42" },
  { cx: 232, cy: 232, size: 16, delay: "0.30" },
  { cx: 296, cy: 236, size: 14, delay: "0.44" },
];
const GRAVEL_GRAINS = Array.from({ length: 90 }, (_, index) => ({
  x: 150 + ((index * 37) % 210),
  y: 212 + ((index * 53) % 48),
  size: 0.8 + (index % 3) * 0.5,
}));

/** Draws the car from above, pointing along the direction of travel. */
function Car() {
  return (
    <g>
      <rect className="car-wheel" x="-30" y="-15" width="13" height="7" rx="1.5" />
      <rect className="car-wheel" x="-30" y="8" width="13" height="7" rx="1.5" />
      <rect className="car-wheel" x="11" y="-14" width="11" height="6" rx="1.5" />
      <rect className="car-wheel" x="11" y="8" width="11" height="6" rx="1.5" />
      <rect className="car-wing" x="-37" y="-12" width="6" height="24" />
      <rect className="car-wing" x="25" y="-14" width="5" height="28" />
      <path className="car-body" d="M-32 -5 L-16 -9 L0 -7 L26 -2.5 V2.5 L0 7 L-16 9 L-32 5 Z" />
      <path className="car-stripe" d="M-16 -1.5 H26 V1.5 H-16 Z" />
      <circle className="car-helmet" cx="-4" cy="0" r="3.6" />
    </g>
  );
}

/** Draws the scene. The moving and parked versions swap by the reduced-motion setting, with no script. */
export function OffTrackScene() {
  return (
    <div className="off-track-scene" aria-hidden="true">
      <svg viewBox="0 0 360 260" focusable="false">
        <defs>
          <pattern id="off-track-asphalt" width="220" height="220" patternUnits="userSpaceOnUse">
            <image href={ASSET_PATHS.asphalt} width="220" height="220" preserveAspectRatio="xMidYMid slice" />
          </pattern>
        </defs>

        <path className="gravel" d="M120 260 C150 214 224 206 300 204 C330 204 360 212 360 222 V260 Z" />
        {GRAVEL_GRAINS.map((grain) => (
          <circle key={`${grain.x}-${grain.y}`} className="gravel-grain" cx={grain.x} cy={grain.y} r={grain.size} />
        ))}

        <path className="track-kerb" d={TRACK} />
        <path className="track-surface" d={TRACK} stroke="url(#off-track-asphalt)" />
        <path className="track-line" d={TRACK} />

        <g className="off-track-live">
          <g>
            <path className="skid" d={SKID_LEFT} pathLength="1">
              <animate attributeName="stroke-dashoffset" values="1;1;0;0" keyTimes="0;0.25;0.44;1" dur={LOOP} repeatCount="indefinite" />
            </path>
            <path className="skid" d={SKID_RIGHT} pathLength="1">
              <animate attributeName="stroke-dashoffset" values="1;1;0;0" keyTimes="0;0.25;0.44;1" dur={LOOP} repeatCount="indefinite" />
            </path>
            <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.92;0.98;1" dur={LOOP} repeatCount="indefinite" />
          </g>

          <g>
            <animateMotion
              path={CAR_ROUTE}
              rotate="auto"
              dur={LOOP}
              repeatCount="indefinite"
              calcMode="spline"
              keyPoints="0;0.62;1;1"
              keyTimes="0;0.24;0.44;1"
              keySplines="0.45 0 0.8 0.7;0.15 0.6 0.25 1;0 0 1 1"
            />
            <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.92;0.98;1" dur={LOOP} repeatCount="indefinite" />
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                values="0;0;-34;-24;-24"
                keyTimes="0;0.24;0.38;0.44;1"
                dur={LOOP}
                repeatCount="indefinite"
              />
              <Car />
            </g>
          </g>

          {DUST.map((puff) => (
            <circle key={puff.cx} className="dust" cx={puff.cx} cy={puff.cy} r="0">
              <animate
                attributeName="r"
                values={`0;0;${puff.size};${puff.size * 1.3};${puff.size * 1.3}`}
                keyTimes={`0;${puff.delay};0.56;0.8;1`}
                dur={LOOP}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0;0.8;0;0"
                keyTimes={`0;${puff.delay};0.5;0.86;1`}
                dur={LOOP}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        <g className="off-track-still">
          <path className="skid skid--drawn" d={SKID_LEFT} />
          <path className="skid skid--drawn" d={SKID_RIGHT} />
          <g transform="translate(262 224) rotate(8)">
            <Car />
          </g>
        </g>
      </svg>
    </div>
  );
}
