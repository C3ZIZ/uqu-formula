// Chooses between the Arabic and English versions of database content.
import type { Locale } from "@/config/locales";

/** Returns the text for the current language, falling back to the other if it is blank. */
export function pickLocalized(locale: Locale, ar: string, en: string): string {
  return locale === "ar" ? ar || en : en || ar;
}
