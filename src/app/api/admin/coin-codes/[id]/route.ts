// Changes or removes a coin QR code.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { activeSchema, coinCodeSchema } from "@/lib/validation";
import { deleteCoinCode, setCoinCodeActive, updateCoinCode } from "@/services/coins";

// Saves edits to a code.
export const PUT = updateRoute(coinCodeSchema, updateCoinCode);

// Switches a code on or off, leaving other edits alone.
export const PATCH = updateRoute(activeSchema, (id, input) => setCoinCodeActive(id, input.isActive));

// Removes a code that nobody has collected yet.
export const DELETE = deleteRoute(deleteCoinCode);
