// Daily attendance codes: an admin creates one per date, and visitors scan it at the entrance.
import { and, asc, eq, sql } from "drizzle-orm";
import { CHECK_IN_STATUS, ERROR_CODES } from "@/config/literals";
import { db } from "@/db/client";
import { attendanceCodes, checkIns } from "@/db/schema";
import { generateCoinToken } from "@/lib/codes";
import { riyadhDate } from "@/lib/dates";
import { normalizeCode } from "@/lib/qr-payload";
import type { AttendanceCodeInput } from "@/lib/validation";

export type AttendanceCode = typeof attendanceCodes.$inferSelect;

/** Records attendance from a scanned code, only on the code's own date at the venue. */
export async function checkInWithCode(userId: string, rawToken: string, now: Date = new Date()) {
  const [code] = await db
    .select()
    .from(attendanceCodes)
    .where(and(eq(attendanceCodes.token, normalizeCode(rawToken)), eq(attendanceCodes.isActive, true)))
    .limit(1);
  if (!code) return { status: CHECK_IN_STATUS.invalid } as const;
  if (code.eventDate !== riyadhDate(now)) {
    return { status: CHECK_IN_STATUS.wrongDay, eventDate: code.eventDate } as const;
  }

  const inserted = await db
    .insert(checkIns)
    .values({ userId, eventDate: code.eventDate, checkedInAt: now })
    .onConflictDoNothing()
    .returning({ userId: checkIns.userId });
  if (inserted.length > 0) return { status: CHECK_IN_STATUS.checkedIn } as const;

  const [existing] = await db
    .select({ at: checkIns.checkedInAt })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.eventDate, code.eventDate)))
    .limit(1);
  return { status: CHECK_IN_STATUS.already, at: existing.at } as const;
}

/** Tells whether a typed code belongs to an attendance code, so the one scan button can route it. */
export async function isAttendanceToken(rawToken: string): Promise<boolean> {
  const [code] = await db
    .select({ id: attendanceCodes.id })
    .from(attendanceCodes)
    .where(eq(attendanceCodes.token, normalizeCode(rawToken)))
    .limit(1);
  return Boolean(code);
}

/** Lists codes by date, with how many visitors attended on each date. */
export async function listAttendanceCodes() {
  return db
    .select({
      id: attendanceCodes.id,
      token: attendanceCodes.token,
      eventDate: attendanceCodes.eventDate,
      isActive: attendanceCodes.isActive,
      // Written with full table names, because both tables have an event_date column.
      checkInCount: sql<number>`(SELECT count(*)::int FROM check_ins WHERE check_ins.event_date = attendance_codes.event_date)`,
    })
    .from(attendanceCodes)
    .orderBy(asc(attendanceCodes.eventDate));
}

/** Loads one code by id. */
export async function getAttendanceCode(id: string): Promise<AttendanceCode | undefined> {
  const [code] = await db.select().from(attendanceCodes).where(eq(attendanceCodes.id, id)).limit(1);
  return code;
}

/** Creates the code for a date, refusing a second code on the same date. */
export async function createAttendanceCode(input: AttendanceCodeInput) {
  const [code] = await db
    .insert(attendanceCodes)
    .values({ eventDate: input.eventDate, token: generateCoinToken() })
    .onConflictDoNothing({ target: attendanceCodes.eventDate })
    .returning();
  if (!code) return { ok: false as const, code: ERROR_CODES.attendanceDateTaken };
  return { ok: true as const, code };
}

/** Switches a code on or off. Returns false if it does not exist. */
export async function setAttendanceCodeActive(id: string, isActive: boolean): Promise<boolean> {
  const rows = await db
    .update(attendanceCodes)
    .set({ isActive })
    .where(eq(attendanceCodes.id, id))
    .returning({ id: attendanceCodes.id });
  return rows.length > 0;
}

/** Deletes a code. Attendance already recorded stays. Returns false if it does not exist. */
export async function deleteAttendanceCode(id: string): Promise<boolean> {
  const rows = await db.delete(attendanceCodes).where(eq(attendanceCodes.id, id)).returning({ id: attendanceCodes.id });
  return rows.length > 0;
}
