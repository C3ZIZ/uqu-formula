// Understands the text read from a QR code or typed by hand.
import { LIMITS } from "@/config/limits";
import { CODE_ALPHABET, CODE_KINDS, CODE_PREFIX, CODE_WORDS } from "@/config/literals";
import { ATTEND_LINK_PATTERN, SCAN_LINK_PATTERN } from "@/config/routes";
import { toLatinDigits } from "./digits";

const SCANNABLE_WORDS = [CODE_WORDS[CODE_KINDS.coin], CODE_WORDS[CODE_KINDS.attendance], CODE_WORDS[CODE_KINDS.badge]];
const RANDOM_PART = `[${CODE_ALPHABET}]{${LIMITS.codeRandomLength}}`;
const ANY_WORD = Object.values(CODE_WORDS).join("|");
const COMPACT_CODE = new RegExp(`^${CODE_PREFIX}(${ANY_WORD})(${RANDOM_PART})$`);
const SCANNABLE_CODE = new RegExp(`^${CODE_PREFIX}-(${SCANNABLE_WORDS.join("|")})-${RANDOM_PART}$`);

/** Cleans a typed code: Latin digits, uppercase, and the standard dashes wherever it is one of our codes. */
export function normalizeCode(value: string): string {
  const compact = toLatinDigits(value).toUpperCase().replace(/[\s-]/g, "");
  const parts = compact.match(COMPACT_CODE);
  return parts ? `${CODE_PREFIX}-${parts[1]}-${parts[2]}` : compact;
}

export type ScanKind = "coin" | "attendance";

export interface ScanTarget {
  kind: ScanKind;
  token: string;
}

/** Works out what a scanned link is for. A typed code goes to the scan screen, which routes it by what it belongs to. */
export function parseScanTarget(text: string): ScanTarget | null {
  const trimmed = text.trim();
  const attend = trimmed.match(ATTEND_LINK_PATTERN)?.[1];
  const coin = trimmed.match(SCAN_LINK_PATTERN)?.[1];
  const token = normalizeCode(attend ?? coin ?? trimmed);
  if (!SCANNABLE_CODE.test(token)) return null;
  return { kind: attend ? "attendance" : "coin", token };
}
