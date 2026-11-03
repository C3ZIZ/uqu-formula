// The official Formula Week mark, cut from the supplied identity file. It takes the surrounding text color.
const MARK_RATIO = 2.316;

interface LogoProps {
  size?: number;
  label?: string;
}

/** Draws the mark at the given height. */
export function Logo({ size = 40, label }: LogoProps) {
  return (
    <span
      className="logo"
      style={{ width: size * MARK_RATIO, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
