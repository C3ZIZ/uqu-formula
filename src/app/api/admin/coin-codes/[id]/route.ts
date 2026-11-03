// Changes or removes a coin QR code.
import { deleteRoute, updateRoute } from "@/lib/crud-route";
import { coinCodeSchema } from "@/lib/validation";
import { deleteCoinCode, updateCoinCode } from "@/services/coins";

// Saves edits to a code, including switching it on or off.
export const PUT = updateRoute(coinCodeSchema, updateCoinCode);

// Removes a code that nobody has collected yet.
export const DELETE = deleteRoute(deleteCoinCode);
