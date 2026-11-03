// Sends the bare site address to the visitor's language.
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { savedLocale } from "@/lib/saved-locale";

/** Redirects to the saved language, or to Arabic by default. */
export async function GET(): Promise<Response> {
  const locale = await savedLocale();
  return new Response(null, { status: 307, headers: { Location: localePath(locale, PAGE_ROUTES.home) } });
}
