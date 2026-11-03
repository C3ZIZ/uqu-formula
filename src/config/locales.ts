// Supported languages and their text direction.
export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

export const LOCALE_DIRECTION: Record<Locale, "rtl" | "ltr"> = { ar: "rtl", en: "ltr" };

export const LOCALE_TAGS: Record<Locale, string> = { ar: "ar-SA-u-nu-latn", en: "en-GB" };

/** Tells whether a URL segment is a supported language. */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
