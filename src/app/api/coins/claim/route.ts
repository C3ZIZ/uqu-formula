// Claims a coin code for the logged-in visitor.
import { jsonOk, readBody, route } from "@/lib/api";
import { apiSession } from "@/lib/auth";
import { claimSchema } from "@/lib/validation";
import { claimCode } from "@/services/coins";

// Gives the visitor the code's coins, once only.
export const POST = route(async (request: Request) => {
  const access = await apiSession();
  if (!access.ok) return access.response;
  const body = await readBody(request, claimSchema);
  if (!body.ok) return body.response;
  return jsonOk(await claimCode(access.value.userId, body.data.token));
});
