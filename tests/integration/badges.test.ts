// Tests challenge badges and the all-days badge: earning, repeats, switching off, images, and deleting.
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { badgeClaims, checkIns } from "@/db/schema";
import { checkInWithCode, createAttendanceCode } from "@/services/attendance-codes";
import {
  claimBadge,
  createBadge,
  deleteBadge,
  getBadge,
  getVisitorBadges,
  isBadgeToken,
  listBadges,
  readBadgeImage,
  setBadgeActive,
  updateBadge,
} from "@/services/badges";
import { createZone } from "@/services/zones";
import { makeUser, resetDatabase } from "./helpers";

const PNG = { data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2]), contentType: "image/png" };
const OTHER_PNG = { data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 9, 9]), contentType: "image/png" };
const FIELDS = { nameAr: "بطل البيت ستوب", nameEn: "Pit champion", challengeAr: "غيّر الإطارات", challengeEn: "Change the tires", icon: "trophy" as const, isActive: true };

/** Creates a badge and fails the test if it is refused. */
async function makeBadge(kind: "challenge" | "all_days" = "challenge", extra = {}) {
  const result = await createBadge({ ...FIELDS, kind, ...extra });
  if (!result.ok) throw new Error(result.code);
  return result.badge;
}

/** Records attendance directly on the given dates. */
async function attend(userId: string, dates: string[]): Promise<void> {
  await db.insert(checkIns).values(dates.map((eventDate) => ({ userId, eventDate })));
}

describe("challenge badges", () => {
  beforeEach(resetDatabase);

  it("gets a readable code", async () => {
    expect((await makeBadge()).token).toMatch(/^UQU-PODIUM-/);
  });

  it("is earned once by scanning", async () => {
    const [visitor, badge] = [await makeUser(), await makeBadge()];
    const first = await claimBadge(visitor.id, badge.token ?? "");
    expect(first).toMatchObject({ status: "claimed", badge: { nameEn: "Pit champion" } });
    expect((await claimBadge(visitor.id, badge.token ?? "")).status).toBe("already");
    expect(await db.select().from(badgeClaims)).toHaveLength(1);
  });

  it("accepts a code typed in lowercase without dashes", async () => {
    const [visitor, badge] = [await makeUser(), await makeBadge()];
    const typed = (badge.token ?? "").replaceAll("-", "").toLowerCase();
    expect((await claimBadge(visitor.id, typed)).status).toBe("claimed");
  });

  it("counts simultaneous scans once", async () => {
    const [visitor, badge] = [await makeUser(), await makeBadge()];
    const results = await Promise.all(Array.from({ length: 10 }, () => claimBadge(visitor.id, badge.token ?? "")));
    expect(results.filter((result) => result.status === "claimed")).toHaveLength(1);
    expect(await db.select().from(badgeClaims)).toHaveLength(1);
  });

  it("records nothing for a switched-off badge or an unknown code", async () => {
    const [visitor, badge] = [await makeUser(), await makeBadge("challenge", { isActive: false })];
    expect((await claimBadge(visitor.id, badge.token ?? "")).status).toBe("invalid");
    expect((await claimBadge(visitor.id, "UQU-PODIUM-222222")).status).toBe("invalid");
    expect(await db.select().from(badgeClaims)).toHaveLength(0);
  });

  it("recognizes its own tokens for the one scan button", async () => {
    const badge = await makeBadge();
    expect(await isBadgeToken((badge.token ?? "").toLowerCase())).toBe(true);
    expect(await isBadgeToken("UQU-PODIUM-222222")).toBe(false);
  });
});

describe("the all-days badge", () => {
  beforeEach(resetDatabase);

  it("has no code and can exist only once", async () => {
    expect((await makeBadge("all_days")).token).toBeNull();
    expect(await createBadge({ ...FIELDS, kind: "all_days" })).toEqual({ ok: false, code: "ALL_DAYS_BADGE_TAKEN" });
  });

  it("shows progress until every day is attended", async () => {
    const [visitor] = [await makeUser(), await makeBadge("all_days")];
    await attend(visitor.id, ["2026-12-13"]);
    expect((await getVisitorBadges(visitor.id))[0]).toMatchObject({ earned: false, attended: 1, totalDays: 3 });
  });

  it("is earned after every day, even by a visitor who attended before it existed", async () => {
    const visitor = await makeUser();
    await attend(visitor.id, ["2026-12-13", "2026-12-14", "2026-12-15"]);
    await makeBadge("all_days");
    expect((await getVisitorBadges(visitor.id))[0]).toMatchObject({ earned: true, attended: 3 });
  });

  it("ignores attendance on dates outside the event", async () => {
    const visitor = await makeUser();
    await makeBadge("all_days");
    await attend(visitor.id, ["2026-12-13", "2026-12-14", "2031-01-01"]);
    expect((await getVisitorBadges(visitor.id))[0]).toMatchObject({ earned: false, attended: 2 });
  });

  it("is announced by the check-in that completes it, and only then", async () => {
    const visitor = await makeUser();
    await makeBadge("all_days");
    const zone = await createZone({ nameAr: "م", nameEn: "G", detailsAr: "", detailsEn: "", type: "entrance", x: 1, y: 1, width: 5, height: 5 });
    await attend(visitor.id, ["2026-12-13", "2026-12-14"]);
    const code = await createAttendanceCode({ eventDate: "2026-12-15", zoneId: zone.id });
    if (!code.ok) throw new Error(code.code);
    const onLastDay = new Date("2026-12-15T08:00:00Z");
    const first = await checkInWithCode(visitor.id, code.code.token, onLastDay);
    expect(first).toMatchObject({ status: "checked_in", allDaysBadge: { nameEn: "Pit champion" } });
    const repeat = await checkInWithCode(visitor.id, code.code.token, onLastDay);
    expect(repeat.status).toBe("already");
    expect(repeat).not.toHaveProperty("allDaysBadge");
  });

  it("does not announce it again on a check-in outside the event", async () => {
    const visitor = await makeUser();
    await makeBadge("all_days");
    await attend(visitor.id, ["2026-12-13", "2026-12-14", "2026-12-15"]);
    const zone = await createZone({ nameAr: "م", nameEn: "G", detailsAr: "", detailsEn: "", type: "entrance", x: 1, y: 1, width: 5, height: 5 });
    const code = await createAttendanceCode({ eventDate: "2031-01-01", zoneId: zone.id });
    if (!code.ok) throw new Error(code.code);
    const result = await checkInWithCode(visitor.id, code.code.token, new Date("2031-01-01T08:00:00Z"));
    expect(result.status).toBe("checked_in");
    expect(result).not.toHaveProperty("allDaysBadge");
  });

  it("is hidden while switched off, and returns when switched on", async () => {
    const visitor = await makeUser();
    const badge = await makeBadge("all_days");
    await attend(visitor.id, ["2026-12-13", "2026-12-14", "2026-12-15"]);
    await setBadgeActive(badge.id, false);
    expect(await getVisitorBadges(visitor.id)).toHaveLength(0);
    await setBadgeActive(badge.id, true);
    expect((await getVisitorBadges(visitor.id))[0]).toMatchObject({ earned: true });
  });

  it("does not announce a check-in that leaves days missing", async () => {
    const visitor = await makeUser();
    await makeBadge("all_days");
    const zone = await createZone({ nameAr: "م", nameEn: "G", detailsAr: "", detailsEn: "", type: "entrance", x: 1, y: 1, width: 5, height: 5 });
    const code = await createAttendanceCode({ eventDate: "2026-12-13", zoneId: zone.id });
    if (!code.ok) throw new Error(code.code);
    const result = await checkInWithCode(visitor.id, code.code.token, new Date("2026-12-13T08:00:00Z"));
    expect(result).not.toHaveProperty("allDaysBadge");
  });
});

describe("what a visitor sees", () => {
  beforeEach(resetDatabase);

  it("puts earned badges first, with the date earned", async () => {
    const visitor = await makeUser();
    await makeBadge("challenge", { nameEn: "Not yet" });
    const earned = await makeBadge("challenge", { nameEn: "Earned" });
    await claimBadge(visitor.id, earned.token ?? "");
    const rows = await getVisitorBadges(visitor.id);
    expect(rows.map((row) => [row.nameEn, row.earned])).toEqual([["Earned", true], ["Not yet", false]]);
    expect(rows[0].earnedAt).toBeInstanceOf(Date);
  });

  it("hides a switched-off badge unless the visitor already earned it", async () => {
    const [visitor, other] = [await makeUser(), await makeUser()];
    const badge = await makeBadge();
    await claimBadge(visitor.id, badge.token ?? "");
    await updateBadge(badge.id, { ...FIELDS, isActive: false });
    expect(await getVisitorBadges(visitor.id)).toHaveLength(1);
    expect(await getVisitorBadges(other.id)).toHaveLength(0);
  });

  it("never exposes a code to visitors", async () => {
    const visitor = await makeUser();
    await makeBadge();
    expect((await getVisitorBadges(visitor.id))[0]).not.toHaveProperty("token");
  });
});

describe("badge images", () => {
  beforeEach(resetDatabase);

  it("stores an uploaded image", async () => {
    const badge = await makeBadge("challenge", { image: PNG });
    expect(badge.imageUpdatedAt).toBeInstanceOf(Date);
    expect(await readBadgeImage(badge.id)).toMatchObject({ contentType: "image/png" });
    expect(Buffer.from((await readBadgeImage(badge.id))?.data ?? [])).toEqual(PNG.data);
  });

  it("keeps the image when an edit does not mention it, and replaces it when one does", async () => {
    const badge = await makeBadge("challenge", { image: PNG });
    await updateBadge(badge.id, { ...FIELDS, nameEn: "Renamed" });
    expect(Buffer.from((await readBadgeImage(badge.id))?.data ?? [])).toEqual(PNG.data);
    await updateBadge(badge.id, { ...FIELDS, image: OTHER_PNG });
    expect(Buffer.from((await readBadgeImage(badge.id))?.data ?? [])).toEqual(OTHER_PNG.data);
  });

  it("goes back to the icon when the image is removed", async () => {
    const badge = await makeBadge("challenge", { image: PNG });
    await updateBadge(badge.id, { ...FIELDS, image: null });
    expect(await readBadgeImage(badge.id)).toBeUndefined();
    expect((await getBadge(badge.id))?.imageUpdatedAt).toBeNull();
    expect((await getBadge(badge.id))?.icon).toBe("trophy");
  });
});

describe("managing badges", () => {
  beforeEach(resetDatabase);

  it("switches on and off without touching anything else", async () => {
    const badge = await makeBadge();
    await updateBadge(badge.id, { ...FIELDS, nameEn: "Edited by another admin" });
    expect(await setBadgeActive(badge.id, false)).toBe(true);
    expect(await getBadge(badge.id)).toMatchObject({ isActive: false, nameEn: "Edited by another admin" });
    expect(await setBadgeActive("00000000-0000-4000-8000-000000000000", true)).toBe(false);
  });

  it("does not change a badge's kind or code on edit", async () => {
    const badge = await makeBadge();
    await updateBadge(badge.id, { ...FIELDS, kind: "all_days", nameEn: "Renamed" } as never);
    expect(await getBadge(badge.id)).toMatchObject({ kind: "challenge", token: badge.token, nameEn: "Renamed" });
  });

  it("lists how many visitors earned each kind", async () => {
    const [visitor, challenge] = [await makeUser(), await makeBadge()];
    await makeBadge("all_days", { nameEn: "All days" });
    await claimBadge(visitor.id, challenge.token ?? "");
    await attend(visitor.id, ["2026-12-13", "2026-12-14", "2026-12-15"]);
    const counts = (await listBadges()).map((badge) => [badge.kind, badge.earnedCount]);
    expect(counts).toEqual(expect.arrayContaining([["challenge", 1], ["all_days", 1]]));
  });

  it("refuses to delete a badge someone earned, with the count", async () => {
    const [visitor, badge] = [await makeUser(), await makeBadge()];
    await claimBadge(visitor.id, badge.token ?? "");
    expect(await deleteBadge(badge.id)).toEqual({
      ok: false,
      code: "IN_USE",
      links: [{ type: "badge_claims", count: 1 }],
    });
  });

  it("refuses to delete an all-days badge someone earned", async () => {
    const [visitor, badge] = [await makeUser(), await makeBadge("all_days")];
    await attend(visitor.id, ["2026-12-13", "2026-12-14", "2026-12-15"]);
    expect(await deleteBadge(badge.id)).toMatchObject({ ok: false, code: "IN_USE" });
  });

  it("deletes an unearned badge along with its image", async () => {
    const badge = await makeBadge("challenge", { image: PNG });
    expect(await deleteBadge(badge.id)).toEqual({ ok: true });
    expect(await readBadgeImage(badge.id)).toBeUndefined();
  });

  it("reports a badge that does not exist", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await deleteBadge(missing)).toEqual({ ok: false, code: "NOT_FOUND" });
    expect(await updateBadge(missing, FIELDS)).toBe(false);
  });
});
