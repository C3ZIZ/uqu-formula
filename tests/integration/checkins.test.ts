// Tests staff check-in: once per visitor per venue day.
import { beforeEach, describe, expect, it } from "vitest";
import { checkInByBadge, getAttendanceDays, hasCheckedIn } from "@/services/checkins";
import { getOverviewCounts } from "@/services/users";
import { makeUser, resetDatabase } from "./helpers";

const DAY_ONE = new Date("2026-12-13T08:00:00Z");
const DAY_ONE_LATER = new Date("2026-12-13T15:00:00Z");
const DAY_TWO = new Date("2026-12-14T08:00:00Z");

describe("check-in", () => {
  beforeEach(resetDatabase);

  it("records a visitor by badge code", async () => {
    const [staff, visitor] = [await makeUser(), await makeUser()];
    expect(await checkInByBadge(staff.id, visitor.badgeCode, DAY_ONE)).toMatchObject({
      status: "checked_in",
      name: visitor.name,
    });
  });

  it("accepts a typed code in lowercase with dashes", async () => {
    const [staff, visitor] = [await makeUser(), await makeUser()];
    const typed = `${visitor.badgeCode.slice(0, 2)}-${visitor.badgeCode.slice(2)}`.toLowerCase();
    expect((await checkInByBadge(staff.id, typed, DAY_ONE)).status).toBe("checked_in");
  });

  it("reports the first time on a repeat scan the same day", async () => {
    const [staff, visitor] = [await makeUser(), await makeUser()];
    await checkInByBadge(staff.id, visitor.badgeCode, DAY_ONE);
    const repeat = await checkInByBadge(staff.id, visitor.badgeCode, DAY_ONE_LATER);
    expect(repeat.status).toBe("already");
    if (repeat.status === "already") expect(repeat.at).toEqual(DAY_ONE);
  });

  it("counts simultaneous scans once", async () => {
    const [staff, visitor] = [await makeUser(), await makeUser()];
    const results = await Promise.all(
      Array.from({ length: 10 }, () => checkInByBadge(staff.id, visitor.badgeCode, DAY_ONE)),
    );
    expect(results.filter((result) => result.status === "checked_in")).toHaveLength(1);
  });

  it("records again on a new day", async () => {
    const [staff, visitor] = [await makeUser(), await makeUser()];
    await checkInByBadge(staff.id, visitor.badgeCode, DAY_ONE);
    expect((await checkInByBadge(staff.id, visitor.badgeCode, DAY_TWO)).status).toBe("checked_in");
    expect(await getAttendanceDays(visitor.id)).toEqual(["2026-12-13", "2026-12-14"]);
  });

  it("reports an unknown badge", async () => {
    const staff = await makeUser();
    expect(await checkInByBadge(staff.id, "FWNOPE", DAY_ONE)).toEqual({ status: "unknown" });
  });

  it("tells a visitor whether they attended on a date", async () => {
    const [staff, visitor] = [await makeUser(), await makeUser()];
    expect(await hasCheckedIn(visitor.id, DAY_ONE)).toBe(false);
    await checkInByBadge(staff.id, visitor.badgeCode, DAY_ONE);
    expect(await hasCheckedIn(visitor.id, DAY_ONE)).toBe(true);
  });

  it("separates registered people from people who attended", async () => {
    const [staff, visitor] = [await makeUser(), await makeUser()];
    await checkInByBadge(staff.id, visitor.badgeCode, DAY_ONE);
    const counts = await getOverviewCounts(DAY_ONE);
    expect(counts).toMatchObject({ registered: 2, attendedToday: 1, attendedEver: 1 });
  });
});
