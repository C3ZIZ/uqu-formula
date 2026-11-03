// Stops the login "next" value from sending people to another website.

/** Returns the path if it stays on this site, otherwise the fallback. */
export function safeNextPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
