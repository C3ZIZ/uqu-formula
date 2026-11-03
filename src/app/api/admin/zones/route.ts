// Adds a map zone.
import { createRoute } from "@/lib/crud-route";
import { zoneSchema } from "@/lib/validation";
import { createZone } from "@/services/zones";

// Creates a zone from the admin form.
export const POST = createRoute(zoneSchema, createZone);
