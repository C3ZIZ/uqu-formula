// Sends the bare site address to the visitor's language.
import { COOKIES } from "@/config/literals";
import { DEFAULT_LOCALE, isLocale } from "@/config/locales";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { cookies } from "next/headers";

/** Redirects to the saved language, or to Arabic by default. */
export async function GET(): Promise<Response> {
  const saved = (await cookies()).get(COOKIES.locale)?.value ?? "";
  const locale = isLocale(saved) ? saved : DEFAULT_LOCALE;
  return new Response(null, { status: 307, headers: { Location: localePath(locale, PAGE_ROUTES.home) } });
}
