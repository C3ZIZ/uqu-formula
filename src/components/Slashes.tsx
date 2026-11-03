// The stacked slanted shapes from the identity, used as a corner decoration on dark bands.

/** Draws the decorative parallelograms. */
export function Slashes() {
  return (
    <svg className="slashes" viewBox="0 0 300 90" aria-hidden="true">
      <path d="M36 90 92 22h62L98 90z" fill="var(--teal)" />
      <path d="M112 90 186 0h34l-74 90z" fill="var(--taupe)" />
      <path d="M160 90 214 24h86l-54 66z" fill="var(--deep)" />
      <path d="M0 90 22 62h34L34 90z" fill="var(--taupe)" opacity="0.55" />
    </svg>
  );
}
