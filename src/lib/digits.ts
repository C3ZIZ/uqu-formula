// Converts digits typed on Arabic keyboards.
const ARABIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

/** Converts Arabic and Persian digits to Latin digits, since phones often type them. */
export function toLatinDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= PERSIAN_ZERO ? PERSIAN_ZERO : ARABIC_ZERO));
  });
}
