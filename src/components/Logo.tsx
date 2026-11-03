// Temporary redrawn Formula Week mark. Replace it when the client supplies the final SVG.

interface LogoProps {
  size?: number;
  label?: string;
}

/** Draws the slanted F with checker marks and a gear. */
export function Logo({ size = 40, label }: LogoProps) {
  return (
    <svg
      width={size * 1.6}
      height={size}
      viewBox="0 0 96 60"
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d="M4 40h7l-3 5H1zM13 33h7l-3 5h-7zM13 45h7l-3 5h-7zM22 40h7l-3 5h-7z" />
      <path d="M41 6h49l-7 11H47l-5 8h28l-7 11H35L25 52H10z" />
      <circle cx="74" cy="42" r="8.5" fill="none" stroke="currentColor" strokeWidth="5" />
      <circle cx="74" cy="42" r="13" fill="none" stroke="currentColor" strokeWidth="4.5" strokeDasharray="5 5.2" />
    </svg>
  );
}
