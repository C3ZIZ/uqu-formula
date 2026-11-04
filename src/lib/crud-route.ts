// Builds the admin create, update, and delete routes shared by zones, agenda, and coin codes.
import { z } from "zod";
import { ERROR_CODES } from "@/config/literals";
import { isAllowedOrigin, jsonError, jsonOk, readBody, route } from "./api";
import { ADMIN_ROLES, apiRole } from "./auth";
import { isForeignKeyViolation, type DeleteOutcome } from "./delete-links";

interface ItemContext {
  params: Promise<{ id: string }>;
}

type DeleteResult = boolean | DeleteOutcome;

// The only link an admin form sets is its place, so a broken link means that place was just deleted.
const PLACE_FIELD = "zoneId";

/** Runs a save, answering clearly when its place no longer exists. */
async function saveWithPlaceCheck(save: () => Promise<Response>): Promise<Response> {
  try {
    return await save();
  } catch (error) {
    if (isForeignKeyViolation(error)) return jsonError(ERROR_CODES.validation, [PLACE_FIELD]);
    throw error;
  }
}

/** Creates the admin-only POST route for a collection. */
export function createRoute<T>(schema: z.ZodType<T>, create: (input: T) => Promise<object>) {
  return route(async (request: Request) => {
    const access = await apiRole(ADMIN_ROLES);
    if (!access.ok) return access.response;
    const body = await readBody(request, schema);
    if (!body.ok) return body.response;
    return saveWithPlaceCheck(async () => jsonOk(await create(body.data), 201));
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
    return saveWithPlaceCheck(async () => ((await update(id, body.data)) ? jsonOk() : jsonError(ERROR_CODES.notFound)));
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
    if (typeof result === "object" && !result.ok) return jsonError(result.code, undefined, result.links);
    return jsonError(ERROR_CODES.notFound);
  });
}
