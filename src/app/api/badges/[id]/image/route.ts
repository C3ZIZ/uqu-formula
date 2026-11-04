// Serves a badge's uploaded image. The address carries a version, so browsers can keep it for a long time.
import { z } from "zod";
import { ERROR_CODES, HEADERS } from "@/config/literals";
import { LIMITS } from "@/config/limits";
import { jsonError, route } from "@/lib/api";
import { readBadgeImage } from "@/services/badges";

// Returns the stored picture, telling browsers never to guess its type.
export const GET = route(async (_request: Request, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return jsonError(ERROR_CODES.notFound);
  const image = await readBadgeImage(id);
  if (!image) return jsonError(ERROR_CODES.notFound);
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": `public, max-age=${LIMITS.badgeImageCacheSeconds}, immutable`,
      [HEADERS.contentTypeOptions]: "nosniff",
    },
  });
});
