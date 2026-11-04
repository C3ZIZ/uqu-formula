// Changes or removes a badge.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { activeSchema, badgeUpdateSchema } from "@/lib/validation";
import { deleteBadge, setBadgeActive, updateBadge } from "@/services/badges";

// Saves edits to a badge.
export const PUT = updateRoute(badgeUpdateSchema, updateBadge);

// Switches a badge on or off, leaving other edits alone.
export const PATCH = updateRoute(activeSchema, (id, input) => setBadgeActive(id, input.isActive));

// Removes a badge that nobody has earned.
export const DELETE = deleteRoute(deleteBadge);
