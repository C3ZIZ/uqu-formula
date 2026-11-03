// Coin codes and claims. The database's primary key guarantees one claim per visitor per code.
import { and, desc, eq, sql, sum } from "drizzle-orm";
import { CLAIM_STATUS, ERROR_CODES } from "@/config/literals";
import type { Locale } from "@/config/locales";
import { db } from "@/db/client";
import { coinClaims, coinCodes } from "@/db/schema";
import { generateCoinToken } from "@/lib/codes";
import { pickLocalized } from "@/lib/localized";
import { normalizeCode } from "@/lib/qr-payload";
import type { CoinCodeInput } from "@/lib/validation";

export type CoinCode = typeof coinCodes.$inferSelect;

/** Adds up a visitor's coins. */
async function totalCoins(userId: string): Promise<number> {
  const [row] = await db.select({ total: sum(coinClaims.coins) }).from(coinClaims).where(eq(coinClaims.userId, userId));
  return Number(row.total ?? 0);
}

/** Tries to give a visitor a code's coins. Simultaneous scans still count once. */
export async function claimCode(userId: string, rawToken: string) {
  const token = normalizeCode(rawToken);
  const [code] = await db
    .select()
    .from(coinCodes)
    .where(and(eq(coinCodes.token, token), eq(coinCodes.isActive, true)))
    .limit(1);
  if (!code) return { status: CLAIM_STATUS.invalid, coins: 0, total: await totalCoins(userId) };

  const inserted = await db
    .insert(coinClaims)
    .values({ userId, codeId: code.id, coins: code.coins })
    .onConflictDoNothing()
    .returning({ coins: coinClaims.coins });

  const status = inserted.length > 0 ? CLAIM_STATUS.claimed : CLAIM_STATUS.already;
  return { status, coins: inserted[0]?.coins ?? 0, total: await totalCoins(userId) };
}

/** Returns a visitor's total and the codes they collected, newest first. */
export async function getCoinSummary(userId: string, locale: Locale) {
  const rows = await db
    .select({
      coins: coinClaims.coins,
      claimedAt: coinClaims.claimedAt,
      labelAr: coinCodes.labelAr,
      labelEn: coinCodes.labelEn,
    })
    .from(coinClaims)
    .innerJoin(coinCodes, eq(coinClaims.codeId, coinCodes.id))
    .where(eq(coinClaims.userId, userId))
    .orderBy(desc(coinClaims.claimedAt));
  return {
    total: rows.reduce((sumSoFar, row) => sumSoFar + row.coins, 0),
    claims: rows.map((row) => ({
      coins: row.coins,
      claimedAt: row.claimedAt,
      label: pickLocalized(locale, row.labelAr, row.labelEn),
    })),
  };
}

/** Lists all codes with how many visitors collected each. */
export async function listCoinCodes() {
  return db
    .select({
      id: coinCodes.id,
      token: coinCodes.token,
      labelAr: coinCodes.labelAr,
      labelEn: coinCodes.labelEn,
      coins: coinCodes.coins,
      isActive: coinCodes.isActive,
      claimCount: sql<number>`(SELECT count(*)::int FROM ${coinClaims} WHERE ${coinClaims.codeId} = ${coinCodes.id})`,
    })
    .from(coinCodes)
    .orderBy(desc(coinCodes.createdAt));
}

/** Loads one code by id. */
export async function getCoinCode(id: string): Promise<CoinCode | undefined> {
  const [code] = await db.select().from(coinCodes).where(eq(coinCodes.id, id)).limit(1);
  return code;
}

/** Creates a code with a new random token. */
export async function createCoinCode(input: CoinCodeInput): Promise<CoinCode> {
  const [code] = await db.insert(coinCodes).values({ ...input, token: generateCoinToken() }).returning();
  return code;
}

/** Changes a code. Coins already earned stay as they were. Returns false if it does not exist. */
export async function updateCoinCode(id: string, input: CoinCodeInput): Promise<boolean> {
  const rows = await db.update(coinCodes).set(input).where(eq(coinCodes.id, id)).returning({ id: coinCodes.id });
  return rows.length > 0;
}

/** Deletes a code unless visitors have already collected it. */
export async function deleteCoinCode(id: string) {
  const hasClaims = sql`EXISTS (SELECT 1 FROM ${coinClaims} WHERE ${coinClaims.codeId} = ${coinCodes.id})`;
  const rows = await db
    .delete(coinCodes)
    .where(and(eq(coinCodes.id, id), sql`NOT ${hasClaims}`))
    .returning({ id: coinCodes.id });
  if (rows.length > 0) return { ok: true as const };
  const exists = await getCoinCode(id);
  return { ok: false as const, code: exists ? ERROR_CODES.codeHasClaims : ERROR_CODES.notFound };
}
