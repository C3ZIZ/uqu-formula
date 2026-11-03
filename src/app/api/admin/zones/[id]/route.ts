// Changes or removes a map zone.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { zoneSchema } from "@/lib/validation";
import { deleteZone, updateZone } from "@/services/zones";

// Saves edits to a zone.
export const PUT = updateRoute(zoneSchema, updateZone);

// Removes a zone.
export const DELETE = deleteRoute(deleteZone);
