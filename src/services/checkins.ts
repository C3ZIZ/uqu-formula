// Attendance: staff scan a badge, and each visitor records once per venue day.
import { and, asc, count, eq } from "drizzle-orm";
import { CHECK_IN_STATUS } from "@/config/literals";
import { db } from "@/db/client";
import { checkIns, users } from "@/db/schema";
import { riyadhDate } from "@/lib/dates";
import { normalizeCode } from "@/lib/qr-payload";

/** Records a visitor's attendance from their badge code. */
export async function checkInByBadge(staffId: string, badgeCode: string, now: Date = new Date()) {
  const [visitor] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.badgeCode, normalizeCode(badgeCode)))
    .limit(1);
  if (!visitor) return { status: CHECK_IN_STATUS.unknown } as const;

  const eventDate = riyadhDate(now);
  const inserted = await db
    .insert(checkIns)
    .values({ userId: visitor.id, eventDate, checkedInBy: staffId, checkedInAt: now })
    .onConflictDoNothing()
    .returning({ userId: checkIns.userId });
  if (inserted.length > 0) return { status: CHECK_IN_STATUS.checkedIn, name: visitor.name } as const;

  const [existing] = await db
    .select({ at: checkIns.checkedInAt })
    .from(checkIns)
    .where(and(eq(checkIns.userId, visitor.id), eq(checkIns.eventDate, eventDate)))
    .limit(1);
  return { status: CHECK_IN_STATUS.already, name: visitor.name, at: existing.at } as const;
}

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
