// Creates a badge.
import { jsonError, jsonOk, readBody, route } from "@/lib/api";
import { ADMIN_ROLES, apiRole } from "@/lib/auth";
import { badgeCreateSchema } from "@/lib/validation";
import { createBadge } from "@/services/badges";

// Creates the badge, unless it would be a second all-days badge.
export const POST = route(async (request: Request) => {
  const access = await apiRole(ADMIN_ROLES);
  if (!access.ok) return access.response;
  const body = await readBody(request, badgeCreateSchema);
  if (!body.ok) return body.response;
  const result = await createBadge(body.data);
  return result.ok ? jsonOk(result.badge, 201) : jsonError(result.code, ["kind"]);
});
