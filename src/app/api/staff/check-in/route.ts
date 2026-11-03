// Records attendance from a scanned or typed badge code.
import { jsonOk, readBody, route } from "@/lib/api";
import { apiRole, STAFF_ROLES } from "@/lib/auth";
import { checkInSchema } from "@/lib/validation";
import { checkInByBadge, countCheckInsToday } from "@/services/checkins";

// Records the visitor and returns today's running total.
export const POST = route(async (request: Request) => {
  const access = await apiRole(STAFF_ROLES);
  if (!access.ok) return access.response;
  const body = await readBody(request, checkInSchema);
  if (!body.ok) return body.response;
  const result = await checkInByBadge(access.value.id, body.data.badgeCode);
  return jsonOk({ ...result, todayCount: await countCheckInsToday() });
});
