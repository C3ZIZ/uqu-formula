// Downloads a coin code's QR as an SVG file for designers and printers.
import { z } from "zod";
import { CONTENT_TYPES, ERROR_CODES } from "@/config/literals";
import { PAGE_ROUTES } from "@/config/routes";
import { jsonError, route } from "@/lib/api";
import { ADMIN_ROLES, apiRole } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { qrSvg } from "@/lib/qr";
import { getCoinCode } from "@/services/coins";

// Draws the QR holding the code's public link.
export const GET = route(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const access = await apiRole(ADMIN_ROLES);
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return jsonError(ERROR_CODES.notFound);
  const code = await getCoinCode(id);
  if (!code) return jsonError(ERROR_CODES.notFound);
  const svg = await qrSvg(`${getEnv().APP_URL}${PAGE_ROUTES.scan(code.token)}`);
  return new Response(svg, {
    headers: {
      "Content-Type": CONTENT_TYPES.svg,
      "Content-Disposition": `attachment; filename="coin-${code.token}.svg"`,
    },
  });
});
