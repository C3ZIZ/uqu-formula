// Understands the text read from a QR code or typed by hand.
import { CODE_ALPHABET } from "@/config/literals";
import { SCAN_LINK_PATTERN } from "@/config/routes";

const TOKEN_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{6,64}$`);

/** Cleans a typed code: uppercase with no outer spaces or dashes. */
export function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replace(/-/g, "");
}

/** Finds the coin token in a scanned link or typed code, or returns null. */
export function parseCoinPayload(text: string): string | null {
  const fromLink = text.trim().match(SCAN_LINK_PATTERN)?.[1];
  const candidate = normalizeCode(fromLink ?? text);
  return TOKEN_PATTERN.test(candidate) ? candidate : null;
}
