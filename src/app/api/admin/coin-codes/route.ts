// Creates a coin QR code.
import { createRoute } from "@/lib/crud-route";
import { coinCodeSchema } from "@/lib/validation";
import { createCoinCode } from "@/services/coins";

// Creates a code with the coins the admin chose.
export const POST = createRoute(coinCodeSchema, createCoinCode);
