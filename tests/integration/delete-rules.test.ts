// Tests that a linked item cannot be deleted, and that the refusal names what it is linked to.
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as createAgendaRoute } from "@/app/api/admin/agenda/route";
import { DELETE as deleteZoneRoute } from "@/app/api/admin/zones/[id]/route";
import { db } from "@/db/client";
import { agendaItems, attendanceCodes, coinClaims, zones } from "@/db/schema";
import { createAgendaItem, deleteAgendaItem } from "@/services/agenda";
import {
  checkInWithCode,
  createAttendanceCode,
  deleteAttendanceCode,
  getAttendanceCode,
  listAttendanceCodes,
  updateAttendanceCode,
} from "@/services/attendance-codes";
import { claimCode, createCoinCode, deleteCoinCode } from "@/services/coins";
import { createZone, deleteZone } from "@/services/zones";
import { makeUser, resetDatabase } from "./helpers";

vi.mock("@/lib/auth", async (original) => ({
  ...(await original<typeof import("@/lib/auth")>()),
  apiRole: async () => ({ ok: true, value: {} }),
}));

const ZONE = { nameAr: "المسرح", nameEn: "Stage", detailsAr: "", detailsEn: "", type: "stage" as const, x: 1, y: 1, width: 10, height: 10 };
const ITEM = { titleAr: "افتتاح", titleEn: "Opening", detailsAr: "", detailsEn: "", day: 1, startTime: "10:00", endTime: "11:00" };
const DAY_ONE = "2026-12-13";
const ON_DAY_ONE = new Date("2026-12-13T08:00:00Z");
const MISSING = "00000000-0000-4000-8000-000000000000";

/** Creates an attendance code on a place and fails the test if it is refused. */
async function makeCode(zoneId: string, eventDate = DAY_ONE) {
  const result = await createAttendanceCode({ eventDate, zoneId });
  if (!result.ok) throw new Error(result.code);
  return result.code;
}

describe("deleting a place", () => {
  beforeEach(resetDatabase);

  it("is refused while an agenda item uses it, naming the item", async () => {
    const zone = await createZone(ZONE);
    await createAgendaItem({ ...ITEM, zoneId: zone.id });
    expect(await deleteZone(zone.id)).toEqual({
      ok: false,
      code: "IN_USE",
      links: [{ type: "agenda_item", nameAr: "افتتاح", nameEn: "Opening", day: 1, startTime: "10:00" }],
    });
    expect(await db.select().from(zones)).toHaveLength(1);
  });

  it("is refused while an attendance code uses it, giving the date", async () => {
    const zone = await createZone(ZONE);
    await makeCode(zone.id);
    expect(await deleteZone(zone.id)).toEqual({
      ok: false,
      code: "IN_USE",
      links: [{ type: "attendance_code", date: DAY_ONE }],
    });
  });

  it("lists agenda items and attendance codes together", async () => {
    const zone = await createZone(ZONE);
    await createAgendaItem({ ...ITEM, zoneId: zone.id });
    await makeCode(zone.id);
    const result = await deleteZone(zone.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.links?.map((link) => link.type)).toEqual(["agenda_item", "attendance_code"]);
  });

  it("works when nothing uses it", async () => {
    const zone = await createZone(ZONE);
    expect(await deleteZone(zone.id)).toEqual({ ok: true });
    expect(await db.select().from(zones)).toHaveLength(0);
  });

  it("reports a place that does not exist", async () => {
    expect(await deleteZone(MISSING)).toEqual({ ok: false, code: "NOT_FOUND" });
  });

  it("is also blocked by the database, so a link made at the same moment cannot be lost", async () => {
    const zone = await createZone(ZONE);
    await db.insert(agendaItems).values({ ...ITEM, zoneId: zone.id });
    await expect(db.delete(zones).where(eq(zones.id, zone.id))).rejects.toThrow();
    const code = await makeCode((await createZone(ZONE)).id);
    await expect(db.delete(zones).where(eq(zones.id, code.zoneId ?? ""))).rejects.toThrow();
  });

  it("answers the API with a conflict and the links", async () => {
    const zone = await createZone(ZONE);
    await createAgendaItem({ ...ITEM, zoneId: zone.id });
    const response = await deleteZoneRoute(new Request("https://site.example/x", { method: "DELETE" }), {
      params: Promise.resolve({ id: zone.id }),
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "IN_USE", links: [{ type: "agenda_item", nameEn: "Opening" }] });
  });
});

describe("deleting an attendance code", () => {
  beforeEach(resetDatabase);

  it("is refused once visitors attended on its date, with the count", async () => {
    const code = await makeCode((await createZone(ZONE)).id);
    const [first, second] = [await makeUser(), await makeUser()];
    await checkInWithCode(first.id, code.token, ON_DAY_ONE);
    await checkInWithCode(second.id, code.token, ON_DAY_ONE);
    expect(await deleteAttendanceCode(code.id)).toEqual({
      ok: false,
      code: "IN_USE",
      links: [{ type: "check_ins", date: DAY_ONE, count: 2 }],
    });
    expect(await db.select().from(attendanceCodes)).toHaveLength(1);
  });

  it("works before anyone attended", async () => {
    const code = await makeCode((await createZone(ZONE)).id);
    expect(await deleteAttendanceCode(code.id)).toEqual({ ok: true });
  });

  it("reports a code that does not exist", async () => {
    expect(await deleteAttendanceCode(MISSING)).toEqual({ ok: false, code: "NOT_FOUND" });
  });
});

describe("deleting a coin code", () => {
  beforeEach(resetDatabase);

  it("is refused once collected, with the count", async () => {
    const code = await createCoinCode({ labelAr: "أ", labelEn: "a", coins: 5, isActive: true });
    await claimCode((await makeUser()).id, code.token);
    expect(await deleteCoinCode(code.id)).toEqual({
      ok: false,
      code: "IN_USE",
      links: [{ type: "coin_claims", count: 1 }],
    });
    expect(await db.select().from(coinClaims)).toHaveLength(1);
  });
});

describe("deleting an agenda item", () => {
  beforeEach(resetDatabase);

  it("always works, because nothing depends on it", async () => {
    const zone = await createZone(ZONE);
    const item = await createAgendaItem({ ...ITEM, zoneId: zone.id });
    expect(await deleteAgendaItem(item.id)).toBe(true);
  });
});

describe("places on attendance codes", () => {
  beforeEach(resetDatabase);

  it("lists each code with its place", async () => {
    const zone = await createZone(ZONE);
    await makeCode(zone.id);
    expect((await listAttendanceCodes())[0]).toMatchObject({ zoneId: zone.id, zoneNameAr: "المسرح", zoneNameEn: "Stage" });
  });

  it("shows the place for printing", async () => {
    const code = await makeCode((await createZone(ZONE)).id);
    expect(await getAttendanceCode(code.id)).toMatchObject({ zoneNameAr: "المسرح", zoneNameEn: "Stage" });
  });

  it("moves a code to another place, including one made before places existed", async () => {
    const [oldCode] = await db.insert(attendanceCodes).values({ token: "UQU-GRID-222222", eventDate: DAY_ONE }).returning();
    const zone = await createZone(ZONE);
    expect(await updateAttendanceCode(oldCode.id, { zoneId: zone.id })).toBe(true);
    expect((await listAttendanceCodes())[0].zoneId).toBe(zone.id);
  });

  it("refuses a place that was deleted while the form was open", async () => {
    expect(await createAttendanceCode({ eventDate: DAY_ONE, zoneId: MISSING })).toEqual({ ok: false, code: "VALIDATION" });
  });

  it("gives a readable answer when an agenda form links a deleted place", async () => {
    const response = await createAgendaRoute(
      new Request("https://site.example/x", {
        method: "POST",
        body: JSON.stringify({ ...ITEM, day: "1", zoneId: MISSING }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "VALIDATION", fields: ["zoneId"] });
  });
});
