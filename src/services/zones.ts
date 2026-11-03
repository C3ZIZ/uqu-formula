// Map zones. Public reads use a short cache, and admin writes clear it.
import { asc, eq } from "drizzle-orm";
import { LIMITS } from "@/config/limits";
import { db } from "@/db/client";
import { zones } from "@/db/schema";
import { createTtlCache } from "@/lib/ttl-cache";
import type { ZoneInput } from "@/lib/validation";
import { clearAgendaCache } from "./agenda";

export type Zone = typeof zones.$inferSelect;

/** Reads all zones from the database. */
export function loadZones(): Promise<Zone[]> {
  return db.select().from(zones).orderBy(asc(zones.y), asc(zones.x));
}

const cache = createTtlCache(loadZones, LIMITS.contentCacheMs);

/** Returns zones for public pages, from the cache when possible. */
export function getZones(): Promise<Zone[]> {
  return cache.get();
}

/** Adds a zone. */
export async function createZone(input: ZoneInput): Promise<Zone> {
  const [zone] = await db.insert(zones).values(input).returning();
  cache.invalidate();
  return zone;
}

/** Changes a zone. Returns false if it does not exist. */
export async function updateZone(id: string, input: ZoneInput): Promise<boolean> {
  const rows = await db.update(zones).set(input).where(eq(zones.id, id)).returning({ id: zones.id });
  cache.invalidate();
  return rows.length > 0;
}

/** Removes a zone. Its agenda items stay, with no set place. Returns false if it does not exist. */
export async function deleteZone(id: string): Promise<boolean> {
  const rows = await db.delete(zones).where(eq(zones.id, id)).returning({ id: zones.id });
  cache.invalidate();
  clearAgendaCache();
  return rows.length > 0;
}
