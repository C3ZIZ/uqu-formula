// Map zones. Public reads use a short cache, and admin writes clear it.
import { asc, eq } from "drizzle-orm";
import { LIMITS } from "@/config/limits";
import { ERROR_CODES } from "@/config/literals";
import { db } from "@/db/client";
import { agendaItems, attendanceCodes, zones } from "@/db/schema";
import { isForeignKeyViolation, type DeleteLink, type DeleteOutcome } from "@/lib/delete-links";
import { createTtlCache } from "@/lib/ttl-cache";
import type { ZoneInput } from "@/lib/validation";

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

/** Lists what uses a zone: agenda items first, then attendance codes. */
async function zoneLinks(id: string): Promise<DeleteLink[]> {
  const [items, codes] = await Promise.all([
    db
      .select({ nameAr: agendaItems.titleAr, nameEn: agendaItems.titleEn, day: agendaItems.day, startTime: agendaItems.startTime })
      .from(agendaItems)
      .where(eq(agendaItems.zoneId, id))
      .orderBy(asc(agendaItems.day), asc(agendaItems.startTime)),
    db
      .select({ date: attendanceCodes.eventDate })
      .from(attendanceCodes)
      .where(eq(attendanceCodes.zoneId, id))
      .orderBy(asc(attendanceCodes.eventDate)),
  ]);
  return [
    ...items.map((item) => ({ type: "agenda_item" as const, ...item })),
    ...codes.map((code) => ({ type: "attendance_code" as const, ...code })),
  ];
}

/** Removes a zone unless something uses it. A link made at the same moment is caught by the database. */
export async function deleteZone(id: string): Promise<DeleteOutcome> {
  const links = await zoneLinks(id);
  if (links.length > 0) return { ok: false, code: ERROR_CODES.inUse, links };
  try {
    const rows = await db.delete(zones).where(eq(zones.id, id)).returning({ id: zones.id });
    cache.invalidate();
    return rows.length > 0 ? { ok: true } : { ok: false, code: ERROR_CODES.notFound };
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error;
    return { ok: false, code: ERROR_CODES.inUse, links: await zoneLinks(id) };
  }
}
