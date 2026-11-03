// Records the logged-in visitor's attendance from a scanned daily code.
import { jsonOk, readBody, route } from "@/lib/api";
import { apiSession } from "@/lib/auth";
import { claimSchema } from "@/lib/validation";
import { checkInWithCode } from "@/services/attendance-codes";

// Checks the code and records one attendance per day.
export const POST = route(async (request: Request) => {
  const access = await apiSession();
  if (!access.ok) return access.response;
  const body = await readBody(request, claimSchema);
  if (!body.ok) return body.response;
  return jsonOk(await checkInWithCode(access.value.userId, body.data.token));
});
