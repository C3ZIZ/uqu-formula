// Tests daily attendance codes: visitors scan once per day, and a code only works on its own date.
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { checkIns } from "@/db/schema";
import {
  checkInWithCode,
  createAttendanceCode,
  deleteAttendanceCode,
  isAttendanceToken,
  listAttendanceCodes,
  setAttendanceCodeActive,
} from "@/services/attendance-codes";
import { checkInByBadge, getAttendanceDays } from "@/services/checkins";
import { makeUser, resetDatabase } from "./helpers";

const DAY_ONE = "2026-12-13";
const ON_DAY_ONE = new Date("2026-12-13T08:00:00Z");
const LATE_ON_DAY_ONE = new Date("2026-12-13T20:30:00Z");
const NEXT_RIYADH_DAY = new Date("2026-12-13T21:30:00Z");

/** Creates a code and fails the test if creation is refused. */
async function makeCode(eventDate = DAY_ONE) {
  const result = await createAttendanceCode({ eventDate });
  if (!result.ok) throw new Error(result.code);
  return result.code;
}

describe("attendance codes", () => {
  beforeEach(resetDatabase);

  it("records a visitor who scans on the right day, with no staff member", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    expect(await checkInWithCode(visitor.id, code.token, ON_DAY_ONE)).toMatchObject({ status: "checked_in" });
    const [row] = await db.select().from(checkIns).where(eq(checkIns.userId, visitor.id));
    expect(row.eventDate).toBe(DAY_ONE);
    expect(row.checkedInBy).toBeNull();
  });

  it("reports the first time on a second scan the same day", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    await checkInWithCode(visitor.id, code.token, ON_DAY_ONE);
    const repeat = await checkInWithCode(visitor.id, code.token, LATE_ON_DAY_ONE);
    expect(repeat.status).toBe("already");
    if (repeat.status === "already") expect(repeat.at).toEqual(ON_DAY_ONE);
  });

  it("counts ten simultaneous scans once", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    const results = await Promise.all(
      Array.from({ length: 10 }, () => checkInWithCode(visitor.id, code.token, ON_DAY_ONE)),
    );
    expect(results.filter((result) => result.status === "checked_in")).toHaveLength(1);
  });

  it("refuses yesterday's code once Riyadh reaches the next day", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    expect(await checkInWithCode(visitor.id, code.token, NEXT_RIYADH_DAY)).toEqual({
      status: "wrong_day",
      eventDate: DAY_ONE,
    });
    expect(await getAttendanceDays(visitor.id)).toEqual([]);
  });

  it("accepts it late in the evening, before Riyadh midnight", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    expect((await checkInWithCode(visitor.id, code.token, LATE_ON_DAY_ONE)).status).toBe("checked_in");
  });

  it("gives nothing for an unknown code", async () => {
    const visitor = await makeUser();
    expect(await checkInWithCode(visitor.id, "NOSUCHCODE22", ON_DAY_ONE)).toEqual({ status: "invalid" });
  });

  it("gives nothing for a switched-off code", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    await setAttendanceCodeActive(code.id, false);
    expect((await checkInWithCode(visitor.id, code.token, ON_DAY_ONE)).status).toBe("invalid");
  });

  it("accepts a lowercase typed token", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    expect((await checkInWithCode(visitor.id, code.token.toLowerCase(), ON_DAY_ONE)).status).toBe("checked_in");
  });

  it("shares one daily record with the staff badge scanner", async () => {
    const [staff, visitor, code] = [await makeUser(), await makeUser(), await makeCode()];
    await checkInByBadge(staff.id, visitor.badgeCode, ON_DAY_ONE);
    expect((await checkInWithCode(visitor.id, code.token, LATE_ON_DAY_ONE)).status).toBe("already");
    expect(await getAttendanceDays(visitor.id)).toEqual([DAY_ONE]);
  });

  it("recognizes its own tokens, even typed in lowercase, for the one scan button", async () => {
    const code = await makeCode();
    expect(await isAttendanceToken(code.token.toLowerCase())).toBe(true);
    expect(await isAttendanceToken("ABCDEFGH2345")).toBe(false);
  });

  it("allows one code per date", async () => {
    await makeCode();
    expect(await createAttendanceCode({ eventDate: DAY_ONE })).toEqual({ ok: false, code: "ATTENDANCE_DATE_TAKEN" });
  });

  it("lists codes by date with how many visitors attended that day", async () => {
    const [first, second, code] = [await makeUser(), await makeUser(), await makeCode()];
    await makeCode("2026-12-14");
    await checkInWithCode(first.id, code.token, ON_DAY_ONE);
    await checkInWithCode(second.id, code.token, ON_DAY_ONE);
    const list = await listAttendanceCodes();
    expect(list.map((item) => item.eventDate)).toEqual([DAY_ONE, "2026-12-14"]);
    expect(list.map((item) => item.checkInCount)).toEqual([2, 0]);
  });

  it("keeps attendance when a code is deleted", async () => {
    const [visitor, code] = [await makeUser(), await makeCode()];
    await checkInWithCode(visitor.id, code.token, ON_DAY_ONE);
    expect(await deleteAttendanceCode(code.id)).toBe(true);
    expect(await getAttendanceDays(visitor.id)).toEqual([DAY_ONE]);
  });

  it("reports a missing code on change and delete", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await setAttendanceCodeActive(missing, false)).toBe(false);
    expect(await deleteAttendanceCode(missing)).toBe(false);
  });
});
