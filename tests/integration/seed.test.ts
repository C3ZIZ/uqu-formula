// Tests that seeding creates the first admin and sample content, and is safe to repeat.
import { count, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { agendaItems, coinCodes, users, zones } from "@/db/schema";
import { runSeed } from "@/db/seed";
import { authenticate } from "@/services/users";
import { resetDatabase } from "./helpers";

const ADMIN = { adminEmail: "Admin@Example.com", adminPassword: "admin-password-1" };

/** Counts the rows in each seeded table. */
async function tableCounts() {
  const counts = await Promise.all(
    [users, zones, agendaItems, coinCodes].map(async (table) => (await db.select({ value: count() }).from(table))[0].value),
  );
  return counts;
}

describe("seed", () => {
  beforeEach(resetDatabase);

  it("creates an admin who can log in, with a lowercase email", async () => {
    await runSeed(ADMIN);
    const [admin] = await db.select().from(users).where(eq(users.email, "admin@example.com"));
    expect(admin.role).toBe("admin");
    expect((await authenticate("admin@example.com", ADMIN.adminPassword)).ok).toBe(true);
  });

  it("adds nothing on a second run", async () => {
    await runSeed(ADMIN);
    const first = await tableCounts();
    await runSeed(ADMIN);
    expect(await tableCounts()).toEqual(first);
    expect(first.every((value) => value > 0)).toBe(true);
  });

  it("keeps content an admin later deleted from coming back while other content exists", async () => {
    await runSeed(ADMIN);
    const [zone] = await db.select().from(zones).limit(1);
    await db.delete(zones).where(eq(zones.id, zone.id));
    const before = await tableCounts();
    await runSeed(ADMIN);
    expect(await tableCounts()).toEqual(before);
  });

  it("places every sample zone inside the map and links agenda items to zones", async () => {
    await runSeed(ADMIN);
    const allZones = await db.select().from(zones);
    expect(allZones.every((zone) => zone.x + zone.width <= 100 && zone.y + zone.height <= 140)).toBe(true);
    const items = await db.select().from(agendaItems);
    expect(items.every((item) => item.zoneId !== null)).toBe(true);
  });
});
