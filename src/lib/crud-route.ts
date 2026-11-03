// Builds the admin create, update, and delete routes shared by zones, agenda, and coin codes.
import { z } from "zod";
import { ERROR_CODES, type ErrorCode } from "@/config/literals";
import { isAllowedOrigin, jsonError, jsonOk, readBody, route } from "./api";
import { ADMIN_ROLES, apiRole } from "./auth";

interface ItemContext {
  params: Promise<{ id: string }>;
}

type DeleteResult = boolean | { ok: true } | { ok: false; code: ErrorCode };

/** Creates the admin-only POST route for a collection. */
export function createRoute<T>(schema: z.ZodType<T>, create: (input: T) => Promise<object>) {
  return route(async (request: Request) => {
    const access = await apiRole(ADMIN_ROLES);
    if (!access.ok) return access.response;
    const body = await readBody(request, schema);
    if (!body.ok) return body.response;
    return jsonOk(await create(body.data), 201);
  });
}

/** Creates the admin-only PUT route for one item. */
export function updateRoute<T>(schema: z.ZodType<T>, update: (id: string, input: T) => Promise<boolean>) {
  return route(async (request: Request, context: ItemContext) => {
    const access = await apiRole(ADMIN_ROLES);
    if (!access.ok) return access.response;
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return jsonError(ERROR_CODES.notFound);
    const body = await readBody(request, schema);
    if (!body.ok) return body.response;
    return (await update(id, body.data)) ? jsonOk() : jsonError(ERROR_CODES.notFound);
  });
}

/** Creates the admin-only DELETE route for one item. */
export function deleteRoute(remove: (id: string) => Promise<DeleteResult>) {
  return route(async (request: Request, context: ItemContext) => {
    if (!isAllowedOrigin(request)) return jsonError(ERROR_CODES.badOrigin);
    const access = await apiRole(ADMIN_ROLES);
    if (!access.ok) return access.response;
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return jsonError(ERROR_CODES.notFound);
    const result = await remove(id);
    if (result === true || (typeof result === "object" && result.ok)) return jsonOk();
    return jsonError(typeof result === "object" && !result.ok ? result.code : ERROR_CODES.notFound);
  });
}
