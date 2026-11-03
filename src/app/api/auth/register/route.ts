// Creates an account and logs the visitor in.
import { ERROR_CODES } from "@/config/literals";
import { jsonError, jsonOk, readBody, route } from "@/lib/api";
import { setSessionCookie } from "@/lib/session";
import { registerSchema } from "@/lib/validation";
import { registerUser } from "@/services/users";

// Registers a visitor from the submitted form.
export const POST = route(async (request: Request) => {
  const body = await readBody(request, registerSchema);
  if (!body.ok) return body.response;
  const result = await registerUser(body.data);
  if (!result.ok) return jsonError(ERROR_CODES.emailTaken, ["email"]);
  const { id, name, role } = result.user;
  await setSessionCookie({ userId: id, name, role });
  return jsonOk({}, 201);
});
