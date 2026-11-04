// Tests admin edits to zones and the agenda.
import { beforeEach, describe, expect, it } from "vitest";
import { createAgendaItem, deleteAgendaItem, getAgenda, updateAgendaItem } from "@/services/agenda";
import { createZone, deleteZone, getZones, updateZone } from "@/services/zones";
import { resetDatabase } from "./helpers";

const ZONE = { nameAr: "المسرح", nameEn: "Stage", detailsAr: "", detailsEn: "", type: "stage" as const, x: 1, y: 1, width: 10, height: 10 };
const ITEM = { titleAr: "افتتاح", titleEn: "Opening", detailsAr: "", detailsEn: "", day: 1, startTime: "10:00", endTime: "11:00", zoneId: null };

describe("zones and agenda", () => {
  beforeEach(resetDatabase);

  it("shows a change immediately in this process", async () => {
    await getZones();
    const zone = await createZone(ZONE);
    expect((await getZones()).map((item) => item.id)).toContain(zone.id);
    await updateZone(zone.id, { ...ZONE, nameEn: "Main stage" });
    expect((await getZones())[0].nameEn).toBe("Main stage");
  });

  it("orders the agenda by day and time", async () => {
    await createAgendaItem({ ...ITEM, day: 2, startTime: "09:00", endTime: "10:00" });
    await createAgendaItem({ ...ITEM, startTime: "12:00", endTime: "13:00" });
    await createAgendaItem(ITEM);
    const agenda = await getAgenda();
    expect(agenda.map((item) => `${item.day}-${item.startTime}`)).toEqual(["1-10:00", "1-12:00", "2-09:00"]);
  });

  it("reports a missing item on update and delete", async () => {
    const missing = "00000000-0000-4000-8000-000000000000";
    expect(await updateAgendaItem(missing, ITEM)).toBe(false);
    expect(await deleteAgendaItem(missing)).toBe(false);
    expect(await updateZone(missing, ZONE)).toBe(false);
    expect(await deleteZone(missing)).toEqual({ ok: false, code: "NOT_FOUND" });
  });
});
