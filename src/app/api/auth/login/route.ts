// Logs a visitor in.
import { jsonError, jsonOk, readBody, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { authenticate } from "@/services/users";

// Checks the email and password, then sets the login cookie.
export const POST = route(async (request: Request) => {
  const body = await readBody(request, loginSchema);
  if (!body.ok) return body.response;
  const result = await authenticate(body.data.email, body.data.password);
  if (!result.ok) return jsonError(result.code);
  const { id, name, role } = result.user;
  await setSessionCookie({ userId: id, name, role });
  return jsonOk();
});
