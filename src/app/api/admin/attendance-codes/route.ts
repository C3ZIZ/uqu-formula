// Creates a daily attendance code.
import { jsonError, jsonOk, readBody, route } from "@/lib/api";
import { ADMIN_ROLES, apiRole } from "@/lib/auth";
import { attendanceCodeSchema } from "@/lib/validation";
import { createAttendanceCode } from "@/services/attendance-codes";

// Creates the code for a date, unless that date already has one.
export const POST = route(async (request: Request) => {
  const access = await apiRole(ADMIN_ROLES);
  if (!access.ok) return access.response;
  const body = await readBody(request, attendanceCodeSchema);
  if (!body.ok) return body.response;
  const result = await createAttendanceCode(body.data);
  return result.ok ? jsonOk(result.code, 201) : jsonError(result.code, ["eventDate"]);
});
