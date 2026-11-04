// Daily attendance codes: an admin creates one per date, and visitors scan it at the entrance.
import { and, asc, count, eq, sql } from "drizzle-orm";
import { CHECK_IN_STATUS, CODE_KINDS, ERROR_CODES } from "@/config/literals";
import { db } from "@/db/client";
import { attendanceCodes, checkIns, zones } from "@/db/schema";
import { generateCode } from "@/lib/codes";
import { isForeignKeyViolation, type DeleteOutcome } from "@/lib/delete-links";
import { riyadhDate } from "@/lib/dates";
import { normalizeCode } from "@/lib/qr-payload";
import type { AttendanceCodeInput, AttendanceCodeUpdate } from "@/lib/validation";

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

const CODE_WITH_PLACE = {
  id: attendanceCodes.id,
  token: attendanceCodes.token,
  eventDate: attendanceCodes.eventDate,
  isActive: attendanceCodes.isActive,
  zoneId: attendanceCodes.zoneId,
  zoneNameAr: zones.nameAr,
  zoneNameEn: zones.nameEn,
};

/** Lists codes by date, with each place and how many visitors attended on each date. */
export async function listAttendanceCodes() {
  return db
    .select({
      ...CODE_WITH_PLACE,
      // Written with full table names, because both tables have an event_date column.
      checkInCount: sql<number>`(SELECT count(*)::int FROM check_ins WHERE check_ins.event_date = attendance_codes.event_date)`,
    })
    .from(attendanceCodes)
    .leftJoin(zones, eq(attendanceCodes.zoneId, zones.id))
    .orderBy(asc(attendanceCodes.eventDate));
}

/** Loads one code and its place by id. */
export async function getAttendanceCode(id: string) {
  const [code] = await db
    .select(CODE_WITH_PLACE)
    .from(attendanceCodes)
    .leftJoin(zones, eq(attendanceCodes.zoneId, zones.id))
    .where(eq(attendanceCodes.id, id))
    .limit(1);
  return code;
}

/** Creates the code for a date and place, refusing a second code on the same date or a deleted place. */
export async function createAttendanceCode(input: AttendanceCodeInput) {
  try {
    const [code] = await db
      .insert(attendanceCodes)
      .values({ eventDate: input.eventDate, zoneId: input.zoneId, token: generateCode(CODE_KINDS.attendance) })
      .onConflictDoNothing({ target: attendanceCodes.eventDate })
      .returning();
    if (!code) return { ok: false as const, code: ERROR_CODES.attendanceDateTaken };
    return { ok: true as const, code };
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error;
    return { ok: false as const, code: ERROR_CODES.validation };
  }
}

/** Changes a code's place or switches it on or off. Returns false if it does not exist. */
export async function updateAttendanceCode(id: string, changes: AttendanceCodeUpdate): Promise<boolean> {
  const rows = await db
    .update(attendanceCodes)
    .set(changes)
    .where(eq(attendanceCodes.id, id))
    .returning({ id: attendanceCodes.id });
  return rows.length > 0;
}

/** Deletes a code unless visitors already attended on its date. */
export async function deleteAttendanceCode(id: string): Promise<DeleteOutcome> {
  const [code] = await db.select({ date: attendanceCodes.eventDate }).from(attendanceCodes).where(eq(attendanceCodes.id, id)).limit(1);
  if (!code) return { ok: false, code: ERROR_CODES.notFound };
  const [attended] = await db.select({ value: count() }).from(checkIns).where(eq(checkIns.eventDate, code.date));
  if (attended.value > 0) {
    return { ok: false, code: ERROR_CODES.inUse, links: [{ type: "check_ins", date: code.date, count: attended.value }] };
  }
  await db.delete(attendanceCodes).where(eq(attendanceCodes.id, id));
  return { ok: true };
}
