// Handles the link printed inside daily attendance QR codes and forwards to the visitor's language.
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { savedLocale } from "@/lib/saved-locale";

/** Redirects to the attendance screen in the saved language. */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }): Promise<Response> {
  const { token } = await context.params;
  const locale = await savedLocale();
  return new Response(null, { status: 307, headers: { Location: localePath(locale, PAGE_ROUTES.attend(token)) } });
}
