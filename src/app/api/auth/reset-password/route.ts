// Finishes a password reset.
import { ERROR_CODES } from "@/config/literals";
import { jsonError, jsonOk, readBody, route } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";
import { resetPassword } from "@/services/users";

// Sets the new password if the emailed token is still valid.
export const POST = route(async (request: Request) => {
  const body = await readBody(request, resetPasswordSchema);
  if (!body.ok) return body.response;
  const changed = await resetPassword(body.data.token, body.data.password);
  return changed ? jsonOk() : jsonError(ERROR_CODES.resetInvalid);
});
