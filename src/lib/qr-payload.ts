// Understands the text read from a QR code or typed by hand.
import { CODE_ALPHABET } from "@/config/literals";
import { ATTEND_LINK_PATTERN, SCAN_LINK_PATTERN } from "@/config/routes";
import { toLatinDigits } from "./digits";

const TOKEN_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{6,64}$`);

/** Cleans a typed code: Latin digits, uppercase, with no outer spaces or dashes. */
export function normalizeCode(value: string): string {
  return toLatinDigits(value).trim().toUpperCase().replace(/-/g, "");
}

/** Finds the coin token in a scanned link or typed code, or returns null. */
export function parseCoinPayload(text: string): string | null {
  const fromLink = text.trim().match(SCAN_LINK_PATTERN)?.[1];
  const candidate = normalizeCode(fromLink ?? text);
  return TOKEN_PATTERN.test(candidate) ? candidate : null;
}

export type ScanKind = "coin" | "attendance";

export interface ScanTarget {
  kind: ScanKind;
  token: string;
}

/** Works out what a scanned link is for. A typed code goes to the coin screen, which forwards attendance codes. */
export function parseScanTarget(text: string): ScanTarget | null {
  const trimmed = text.trim();
  const attend = trimmed.match(ATTEND_LINK_PATTERN)?.[1];
  const coin = trimmed.match(SCAN_LINK_PATTERN)?.[1];
  const token = normalizeCode(attend ?? coin ?? trimmed);
  if (!TOKEN_PATTERN.test(token)) return null;
  return { kind: attend ? "attendance" : "coin", token };
}
