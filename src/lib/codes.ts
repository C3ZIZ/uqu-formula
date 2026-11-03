// Creates random codes that are hard to guess and easy to read aloud.
import { randomInt } from "node:crypto";
import { LIMITS } from "@/config/limits";
import { BADGE_CODE_PREFIX, CODE_ALPHABET } from "@/config/literals";

/** Picks random characters from an alphabet without look-alike letters. */
function randomCode(length: number): string {
  return Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/** Creates the token printed inside a coin QR code. */
export function generateCoinToken(): string {
  return randomCode(LIMITS.coinCodeLength);
}

/** Creates the code shown on a visitor's badge. */
export function generateBadgeCode(): string {
  return BADGE_CODE_PREFIX + randomCode(LIMITS.badgeCodeLength);
}
