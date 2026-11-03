// Starts a password reset. The reply is the same whether or not the email is registered.
import { QUERY_PARAMS } from "@/config/literals";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { jsonOk, readBody, route } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { sendPasswordResetEmail } from "@/lib/mail";
import { forgotPasswordSchema } from "@/lib/validation";
import { requestPasswordReset } from "@/services/users";

/** Creates a reset link and emails it. Failures are logged, because the visitor must not learn the outcome. */
async function sendResetLink(email: string, locale: "ar" | "en"): Promise<void> {
  try {
    const token = await requestPasswordReset(email);
    if (!token) return;
    const params = new URLSearchParams({ [QUERY_PARAMS.token]: token });
    const link = `${getEnv().APP_URL}${localePath(locale, PAGE_ROUTES.resetPassword)}?${params}`;
    await sendPasswordResetEmail(email, link, locale);
  } catch (error) {
    console.error("Password reset email failed", error);
  }
}

// Replies immediately and sends the email in the background, so timing reveals nothing.
export const POST = route(async (request: Request) => {
  const body = await readBody(request, forgotPasswordSchema);
  if (!body.ok) return body.response;
  void sendResetLink(body.data.email, body.data.locale);
  return jsonOk();
});
