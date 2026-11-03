// Helpers for server pages.
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/config/locales";

export interface LocaleProps {
  params: Promise<{ locale: string }>;
}

/** Reads the language from the URL, showing not-found for anything unsupported. */
export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
