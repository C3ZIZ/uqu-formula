// Logs a visitor out.
import { ERROR_CODES } from "@/config/literals";
import { isAllowedOrigin, jsonError, jsonOk, route } from "@/lib/api";
import { clearSessionCookie } from "@/lib/session";

// Removes the login cookie.
export const POST = route(async (request: Request) => {
  if (!isAllowedOrigin(request)) return jsonError(ERROR_CODES.badOrigin);
  await clearSessionCookie();
  return jsonOk();
});
