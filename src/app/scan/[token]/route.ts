// Handles the link printed inside coin QR codes and forwards to the visitor's language.
import { cookies } from "next/headers";
import { COOKIES } from "@/config/literals";
import { DEFAULT_LOCALE, isLocale } from "@/config/locales";
import { localePath, PAGE_ROUTES } from "@/config/routes";

/** Redirects to the scan page in the saved language. */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await context.params;
  const saved = (await cookies()).get(COOKIES.locale)?.value ?? "";
  const locale = isLocale(saved) ? saved : DEFAULT_LOCALE;
  return new Response(null, { status: 307, headers: { Location: localePath(locale, PAGE_ROUTES.scan(token)) } });
}
