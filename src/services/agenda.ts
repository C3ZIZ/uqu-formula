// Agenda items. Public reads use a short cache, and admin writes clear it.
import { asc, eq } from "drizzle-orm";
import { LIMITS } from "@/config/limits";
import { db } from "@/db/client";
import { agendaItems } from "@/db/schema";
import { createTtlCache } from "@/lib/ttl-cache";
import type { AgendaInput } from "@/lib/validation";

export type AgendaItem = typeof agendaItems.$inferSelect;

/** Reads the agenda from the database in day and time order. */
export function loadAgenda(): Promise<AgendaItem[]> {
  return db.select().from(agendaItems).orderBy(asc(agendaItems.day), asc(agendaItems.startTime));
}

const cache = createTtlCache(loadAgenda, LIMITS.contentCacheMs);

/** Returns the agenda for public pages, from the cache when possible. */
export function getAgenda(): Promise<AgendaItem[]> {
  return cache.get();
}

/** Adds an agenda item. */
export async function createAgendaItem(input: AgendaInput): Promise<AgendaItem> {
  const [item] = await db.insert(agendaItems).values(input).returning();
  cache.invalidate();
  return item;
}

/** Changes an agenda item. Returns false if it does not exist. */
export async function updateAgendaItem(id: string, input: AgendaInput): Promise<boolean> {
  const rows = await db.update(agendaItems).set(input).where(eq(agendaItems.id, id)).returning({ id: agendaItems.id });
  cache.invalidate();
  return rows.length > 0;
}

/** Removes an agenda item. Returns false if it does not exist. */
export async function deleteAgendaItem(id: string): Promise<boolean> {
  const rows = await db.delete(agendaItems).where(eq(agendaItems.id, id)).returning({ id: agendaItems.id });
  cache.invalidate();
  return rows.length > 0;
}
