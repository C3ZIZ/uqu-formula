// Changes or removes a badge.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { badgeUpdateSchema } from "@/lib/validation";
import { deleteBadge, updateBadge } from "@/services/badges";

// Saves edits to a badge, including switching it on or off.
export const PUT = updateRoute(badgeUpdateSchema, updateBadge);

// Removes a badge that nobody has earned.
export const DELETE = deleteRoute(deleteBadge);
