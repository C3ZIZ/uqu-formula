// Health check used by Caddy and Docker. It also confirms the database answers.
import { sql } from "drizzle-orm";
import { ERROR_CODES } from "@/config/literals";
import { db } from "@/db/client";
import { jsonError, jsonOk } from "@/lib/api";

/** Reports healthy only when the database responds. */
export async function GET(): Promise<Response> {
  try {
    await db.execute(sql`SELECT 1`);
    return jsonOk({ status: "ok" });
  } catch {
    return jsonError(ERROR_CODES.server);
  }
}
