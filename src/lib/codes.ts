// Creates readable codes: the university, a Formula word showing the code's purpose, and a random part.
import { randomInt } from "node:crypto";
import { LIMITS } from "@/config/limits";
import { CODE_ALPHABET, CODE_PREFIX, CODE_WORDS, type CodeKind } from "@/config/literals";

/** Picks random characters from an alphabet without look-alike letters. */
function randomPart(length: number): string {
  return Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/** Creates a code such as UQU-PIT-7K3Q9M. */
export function generateCode(kind: CodeKind): string {
  return `${CODE_PREFIX}-${CODE_WORDS[kind]}-${randomPart(LIMITS.codeRandomLength)}`;
}
