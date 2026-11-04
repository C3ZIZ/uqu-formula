// Tests the coin rules against real PostgreSQL, including simultaneous scans.
import { count, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/client";
import { coinClaims } from "@/db/schema";
import {
  claimCode,
  createCoinCode,
  deleteCoinCode,
  getCoinSummary,
  listCoinCodes,
  updateCoinCode,
} from "@/services/coins";
import { makeUser, resetDatabase } from "./helpers";

const CODE = { labelAr: "ورشة", labelEn: "Workshop", coins: 50, isActive: true };

describe("coin codes", () => {
  beforeEach(resetDatabase);

  it("gives the coins on the first scan", async () => {
    const user = await makeUser();
    const code = await createCoinCode(CODE);
    expect(await claimCode(user.id, code.token)).toMatchObject({ status: "claimed", coins: 50, total: 50 });
  });

  it("refuses a second scan and keeps the total", async () => {
    const user = await makeUser();
    const code = await createCoinCode(CODE);
    await claimCode(user.id, code.token);
    expect(await claimCode(user.id, code.token)).toMatchObject({ status: "already", total: 50 });
  });

  it("counts twenty simultaneous scans once", async () => {
    const user = await makeUser();
    const code = await createCoinCode(CODE);
    const results = await Promise.all(Array.from({ length: 20 }, () => claimCode(user.id, code.token)));
    expect(results.filter((result) => result.status === "claimed")).toHaveLength(1);
    expect(results.filter((result) => result.status === "already")).toHaveLength(19);
    const [row] = await db.select({ value: count() }).from(coinClaims).where(eq(coinClaims.userId, user.id));
    expect(row.value).toBe(1);
    expect((await getCoinSummary(user.id, "en")).total).toBe(50);
  });

  it("lets different visitors each earn the same code", async () => {
    const [first, second] = [await makeUser(), await makeUser()];
    const code = await createCoinCode(CODE);
    expect((await claimCode(first.id, code.token)).status).toBe("claimed");
    expect((await claimCode(second.id, code.token)).status).toBe("claimed");
  });

  it("adds up coins from different codes", async () => {
    const user = await makeUser();
    await claimCode(user.id, (await createCoinCode(CODE)).token);
    await claimCode(user.id, (await createCoinCode({ ...CODE, coins: 25 })).token);
    const summary = await getCoinSummary(user.id, "en");
    expect(summary.total).toBe(75);
    expect(summary.claims).toHaveLength(2);
  });

  it("gives nothing for an unknown code", async () => {
    const user = await makeUser();
    expect(await claimCode(user.id, "NOSUCHCODE22")).toMatchObject({ status: "invalid", total: 0 });
  });

  it("gives nothing for a switched-off code", async () => {
    const user = await makeUser();
    const code = await createCoinCode({ ...CODE, isActive: false });
    expect((await claimCode(user.id, code.token)).status).toBe("invalid");
  });

  it("accepts a lowercase typed token", async () => {
    const user = await makeUser();
    const code = await createCoinCode(CODE);
    expect((await claimCode(user.id, code.token.toLowerCase())).status).toBe("claimed");
  });

  it("keeps earned coins when an admin edits the code later", async () => {
    const user = await makeUser();
    const code = await createCoinCode(CODE);
    await claimCode(user.id, code.token);
    await updateCoinCode(code.id, { ...CODE, coins: 999 });
    expect((await getCoinSummary(user.id, "en")).total).toBe(50);
  });

  it("refuses to delete a code that has claims", async () => {
    const user = await makeUser();
    const code = await createCoinCode(CODE);
    await claimCode(user.id, code.token);
    expect(await deleteCoinCode(code.id)).toMatchObject({ ok: false, code: "IN_USE" });
    expect((await getCoinSummary(user.id, "en")).total).toBe(50);
  });

  it("deletes a code with no claims", async () => {
    const code = await createCoinCode(CODE);
    expect(await deleteCoinCode(code.id)).toEqual({ ok: true });
    expect(await listCoinCodes()).toHaveLength(0);
  });

  it("reports how many visitors collected each code", async () => {
    const code = await createCoinCode(CODE);
    await claimCode((await makeUser()).id, code.token);
    await claimCode((await makeUser()).id, code.token);
    expect((await listCoinCodes())[0].claimCount).toBe(2);
  });
});
