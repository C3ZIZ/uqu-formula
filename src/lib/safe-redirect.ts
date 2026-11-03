// Stops the login "next" value from sending people to another website.
const CONTROL_OR_BACKSLASH = /[\u0000-\u001f\u007f\\]/;
const PLACEHOLDER_ORIGIN = "https://this-site.invalid";

/** Returns the path if it stays on this site, otherwise the fallback. Browsers ignore tabs and newlines, so those are refused. */
export function safeNextPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || CONTROL_OR_BACKSLASH.test(value)) return fallback;
  const parsed = new URL(value, PLACEHOLDER_ORIGIN);
  if (parsed.origin !== PLACEHOLDER_ORIGIN) return fallback;
  return parsed.pathname + parsed.search + parsed.hash;
}
