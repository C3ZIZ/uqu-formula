// Changes a user's role.
import { z } from "zod";
import { ERROR_CODES } from "@/config/literals";
import { jsonError, jsonOk, readBody, route } from "@/lib/api";
import { ADMIN_ROLES, apiRole } from "@/lib/auth";
import { roleSchema } from "@/lib/validation";
import { setUserRole } from "@/services/users";

// Applies the new role. The service protects the last admin.
export const PUT = route(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const access = await apiRole(ADMIN_ROLES);
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return jsonError(ERROR_CODES.notFound);
  const body = await readBody(request, roleSchema);
  if (!body.ok) return body.response;
  const result = await setUserRole(id, body.data.role);
  return result.ok ? jsonOk() : jsonError(result.code);
});
