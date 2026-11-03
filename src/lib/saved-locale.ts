// Reads the visitor's saved language for links that have no language in their address.
import { cookies } from "next/headers";
import { COOKIES } from "@/config/literals";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/config/locales";

/** Returns the saved language, or Arabic by default. */
export async function savedLocale(): Promise<Locale> {
  const saved = (await cookies()).get(COOKIES.locale)?.value ?? "";
  return isLocale(saved) ? saved : DEFAULT_LOCALE;
}
