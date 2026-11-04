// Creates a daily attendance code.
import { ERROR_CODES } from "@/config/literals";
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
  if (result.ok) return jsonOk(result.code, 201);
  return jsonError(result.code, [result.code === ERROR_CODES.validation ? "zoneId" : "eventDate"]);
});
