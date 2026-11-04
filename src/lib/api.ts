// Shared building blocks for API routes: replies, origin checks, body parsing, and error catching.
import { z } from "zod";
import { ERROR_CODES, HEADERS, type ErrorCode } from "@/config/literals";
import type { DeleteLink } from "./delete-links";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  BAD_ORIGIN: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  LAST_ADMIN: 409,
  IN_USE: 409,
  ATTENDANCE_DATE_TAKEN: 409,
  RESET_INVALID: 400,
  SERVER: 500,
};

/** Sends a successful JSON reply. */
export function jsonOk(data: object = {}, status = 200): Response {
  return Response.json(data, { status });
}

/** Sends an error reply with a stable code that the interface translates. */
export function jsonError(code: ErrorCode, fields?: string[], links?: DeleteLink[]): Response {
  return Response.json({ error: code, ...(fields ? { fields } : {}), ...(links ? { links } : {}) }, { status: STATUS[code] });
}

/** Blocks changes sent from other websites. */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get(HEADERS.origin);
  if (!origin) return true;
  const host = request.headers.get(HEADERS.forwardedHost) ?? request.headers.get(HEADERS.host);
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type BodyResult<T> = { ok: true; data: T } | { ok: false; response: Response };

/** Checks the origin, then reads and validates a JSON body. */
export async function readBody<T>(request: Request, schema: z.ZodType<T>): Promise<BodyResult<T>> {
  if (!isAllowedOrigin(request)) return { ok: false, response: jsonError(ERROR_CODES.badOrigin) };
  const raw = await request.json().catch(() => undefined);
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "")).filter(Boolean))];
  return { ok: false, response: jsonError(ERROR_CODES.validation, fields) };
}

/** Wraps a route so an unexpected failure gives a clean error and a log line. */
export function route<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API route failed", error);
      return jsonError(ERROR_CODES.server);
    }
  };
}
