// Gives the logged-in visitor the badge behind a scanned code.
import { jsonOk, readBody, route } from "@/lib/api";
import { apiSession } from "@/lib/auth";
import { claimSchema } from "@/lib/validation";
import { claimBadge } from "@/services/badges";

// Records the badge once per visitor.
export const POST = route(async (request: Request) => {
  const access = await apiSession();
  if (!access.ok) return access.response;
  const body = await readBody(request, claimSchema);
  if (!body.ok) return body.response;
  return jsonOk(await claimBadge(access.value.userId, body.data.token));
});
