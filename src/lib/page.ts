// Helpers for server pages.
import { notFound } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/config/locales";

export interface LocaleProps {
  params: Promise<{ locale: string }>;
}

/** Reads the language for the page shell. An unknown address still gets Arabic, so it can show the not-found page. */
export function layoutLocale(value: string): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Reads the language from the URL, showing not-found for anything unsupported. */
export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
