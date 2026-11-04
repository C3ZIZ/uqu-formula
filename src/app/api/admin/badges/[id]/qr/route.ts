// Downloads a challenge badge's QR as an SVG file for designers and printers.
import { z } from "zod";
import { CONTENT_TYPES, ERROR_CODES } from "@/config/literals";
import { PAGE_ROUTES } from "@/config/routes";
import { jsonError, route } from "@/lib/api";
import { ADMIN_ROLES, apiRole } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { qrSvg } from "@/lib/qr";
import { getBadge } from "@/services/badges";

// Draws the QR holding the badge's public link. The all-days badge has none.
export const GET = route(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const access = await apiRole(ADMIN_ROLES);
  if (!access.ok) return access.response;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return jsonError(ERROR_CODES.notFound);
  const badge = await getBadge(id);
  if (!badge?.token) return jsonError(ERROR_CODES.notFound);
  const svg = await qrSvg(`${getEnv().APP_URL}${PAGE_ROUTES.scan(badge.token)}`);
  return new Response(svg, {
    headers: {
      "Content-Type": CONTENT_TYPES.svg,
      "Content-Disposition": `attachment; filename="${badge.token}.svg"`,
    },
  });
});
