// Reads attendance. Visitors record it by scanning the daily code, once per venue day.
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { checkIns } from "@/db/schema";
import { riyadhDate } from "@/lib/dates";

/** Lists the venue dates a visitor attended. */
export async function getAttendanceDays(userId: string): Promise<string[]> {
  const rows = await db
    .select({ date: checkIns.eventDate })
    .from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(asc(checkIns.eventDate));
  return rows.map((row) => row.date);
}

/** Tells whether a visitor attended on the venue date of the given moment. */
export async function hasCheckedIn(userId: string, now: Date = new Date()): Promise<boolean> {
  const [row] = await db
    .select({ value: count() })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.eventDate, riyadhDate(now))));
  return row.value > 0;
}

/** Counts visitors who attended on the venue date of the given moment. */
export async function countCheckInsToday(now: Date = new Date()): Promise<number> {
  const [row] = await db.select({ value: count() }).from(checkIns).where(eq(checkIns.eventDate, riyadhDate(now)));
  return row.value;
}
