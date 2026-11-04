// Tests reading attendance: what a visitor attended and how it is counted.
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { checkIns } from "@/db/schema";
import { getAttendanceDays, hasCheckedIn } from "@/services/checkins";
import { getOverviewCounts } from "@/services/users";
import { makeUser, resetDatabase } from "./helpers";

const DAY_ONE = new Date("2026-12-13T08:00:00Z");

/** Records attendance directly, since scanning has its own tests. */
async function attend(userId: string, eventDate: string): Promise<void> {
  await db.insert(checkIns).values({ userId, eventDate });
}

describe("attendance records", () => {
  beforeEach(resetDatabase);

  it("lists each date a visitor attended", async () => {
    const visitor = await makeUser();
    await attend(visitor.id, "2026-12-14");
    await attend(visitor.id, "2026-12-13");
    expect(await getAttendanceDays(visitor.id)).toEqual(["2026-12-13", "2026-12-14"]);
  });

  it("tells a visitor whether they attended on a date", async () => {
    const visitor = await makeUser();
    expect(await hasCheckedIn(visitor.id, DAY_ONE)).toBe(false);
    await attend(visitor.id, "2026-12-13");
    expect(await hasCheckedIn(visitor.id, DAY_ONE)).toBe(true);
  });

  it("separates registered people from people who attended", async () => {
    const [, visitor] = [await makeUser(), await makeUser()];
    await attend(visitor.id, "2026-12-13");
    const counts = await getOverviewCounts(DAY_ONE);
    expect(counts).toMatchObject({ registered: 2, attendedToday: 1, attendedEver: 1 });
  });
});
