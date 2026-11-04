// Badges: challenge badges earned by scanning, and the all-days badge worked out from attendance.
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { EVENT } from "@/config/event";
import { BADGE_KINDS_BY_NAME, CLAIM_STATUS, CODE_KINDS, ERROR_CODES } from "@/config/literals";
import { db } from "@/db/client";
import { badgeClaims, badgeImages, badges, checkIns } from "@/db/schema";
import type { BadgeImage } from "@/lib/badge-image";
import { generateCode } from "@/lib/codes";
import { isForeignKeyViolation, type DeleteOutcome } from "@/lib/delete-links";
import { normalizeCode } from "@/lib/qr-payload";
import type { BadgeCreateInput, BadgeUpdateInput } from "@/lib/validation";

export type Badge = typeof badges.$inferSelect;

const EVENT_DATES: string[] = EVENT.days.map((day) => day.date);
const TOTAL_DAYS = EVENT_DATES.length;

/** Counts how many event days a visitor attended. */
async function attendedDays(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(checkIns)
    .where(and(eq(checkIns.userId, userId), inArray(checkIns.eventDate, EVENT_DATES)));
  return row.value;
}

/** Counts visitors who attended every event day. */
async function countAllDaysEarners(): Promise<number> {
  const earners = db
    .select({ userId: checkIns.userId })
    .from(checkIns)
    .where(inArray(checkIns.eventDate, EVENT_DATES))
    .groupBy(checkIns.userId)
    .having(sql`count(*) = ${TOTAL_DAYS}`)
    .as("earners");
  const [row] = await db.select({ value: count() }).from(earners);
  return row.value;
}

/** Gives a visitor the badge behind a scanned code. Simultaneous scans still count once. */
export async function claimBadge(userId: string, rawToken: string) {
  const [badge] = await db
    .select()
    .from(badges)
    .where(and(eq(badges.token, normalizeCode(rawToken)), eq(badges.isActive, true)))
    .limit(1);
  if (!badge) return { status: CLAIM_STATUS.invalid } as const;
  const inserted = await db
    .insert(badgeClaims)
    .values({ userId, badgeId: badge.id })
    .onConflictDoNothing()
    .returning({ badgeId: badgeClaims.badgeId });
  const shown = {
    id: badge.id,
    nameAr: badge.nameAr,
    nameEn: badge.nameEn,
    icon: badge.icon,
    imageUpdatedAt: badge.imageUpdatedAt,
  };
  return { status: inserted.length > 0 ? CLAIM_STATUS.claimed : CLAIM_STATUS.already, badge: shown };
}

/** Tells whether a typed code belongs to a badge, so the one scan button can route it. */
export async function isBadgeToken(rawToken: string): Promise<boolean> {
  const [badge] = await db.select({ id: badges.id }).from(badges).where(eq(badges.token, normalizeCode(rawToken))).limit(1);
  return Boolean(badge);
}

/** Returns the all-days badge if attending this date has just completed every day. Other dates change nothing. */
export async function completedAllDaysBadge(userId: string, eventDate: string) {
  if (!EVENT_DATES.includes(eventDate) || (await attendedDays(userId)) < TOTAL_DAYS) return undefined;
  const [badge] = await db
    .select({ nameAr: badges.nameAr, nameEn: badges.nameEn })
    .from(badges)
    .where(and(eq(badges.kind, BADGE_KINDS_BY_NAME.allDays), eq(badges.isActive, true)))
    .limit(1);
  return badge;
}

/** Lists the badges a visitor can see: earned ones first, then the active ones still to earn. */
export async function getVisitorBadges(userId: string) {
  const [rows, attended] = await Promise.all([
    db
      .select({
        id: badges.id,
        kind: badges.kind,
        nameAr: badges.nameAr,
        nameEn: badges.nameEn,
        challengeAr: badges.challengeAr,
        challengeEn: badges.challengeEn,
        icon: badges.icon,
        imageUpdatedAt: badges.imageUpdatedAt,
        isActive: badges.isActive,
        claimedAt: badgeClaims.claimedAt,
      })
      .from(badges)
      .leftJoin(badgeClaims, and(eq(badgeClaims.badgeId, badges.id), eq(badgeClaims.userId, userId)))
      .orderBy(asc(badges.createdAt)),
    attendedDays(userId),
  ]);
  return rows
    .map(({ claimedAt, ...badge }) => ({
      ...badge,
      // The all-days badge is worked out, not stored, so switching it off hides it until it is switched on again.
      earned: badge.kind === BADGE_KINDS_BY_NAME.allDays ? badge.isActive && attended >= TOTAL_DAYS : claimedAt !== null,
      earnedAt: claimedAt,
      attended,
      totalDays: TOTAL_DAYS,
    }))
    .filter((badge) => badge.isActive || badge.earned)
    .sort((first, second) => Number(second.earned) - Number(first.earned));
}

/** Lists all badges for the admin, with how many visitors earned each. */
export async function listBadges() {
  const [rows, allDaysEarners] = await Promise.all([
    db
      .select({
        id: badges.id,
        kind: badges.kind,
        token: badges.token,
        nameAr: badges.nameAr,
        nameEn: badges.nameEn,
        challengeAr: badges.challengeAr,
        challengeEn: badges.challengeEn,
        icon: badges.icon,
        imageUpdatedAt: badges.imageUpdatedAt,
        isActive: badges.isActive,
        claimCount: sql<number>`(SELECT count(*)::int FROM ${badgeClaims} WHERE ${badgeClaims.badgeId} = ${badges.id})`,
      })
      .from(badges)
      .orderBy(desc(badges.createdAt)),
    countAllDaysEarners(),
  ]);
  return rows.map(({ claimCount, ...badge }) => ({
    ...badge,
    earnedCount: badge.kind === BADGE_KINDS_BY_NAME.allDays ? allDaysEarners : claimCount,
  }));
}

/** Loads one badge by id. */
export async function getBadge(id: string): Promise<Badge | undefined> {
  const [badge] = await db.select().from(badges).where(eq(badges.id, id)).limit(1);
  return badge;
}

/** Loads a badge's uploaded image, if it has one. */
export async function readBadgeImage(id: string): Promise<BadgeImage | undefined> {
  const [image] = await db
    .select({ data: badgeImages.data, contentType: badgeImages.contentType })
    .from(badgeImages)
    .where(eq(badgeImages.badgeId, id))
    .limit(1);
  return image;
}

/** Creates a badge. Challenge badges get a code, and only one all-days badge can exist. */
export async function createBadge(input: BadgeCreateInput) {
  const { kind, image, ...fields } = input;
  return db.transaction(async (tx) => {
    const isChallenge = kind === BADGE_KINDS_BY_NAME.challenge;
    const [badge] = await tx
      .insert(badges)
      .values({
        ...fields,
        kind,
        token: isChallenge ? generateCode(CODE_KINDS.badge) : null,
        imageUpdatedAt: image ? new Date() : null,
      })
      .onConflictDoNothing()
      .returning();
    if (!badge) return { ok: false as const, code: ERROR_CODES.allDaysBadgeTaken };
    if (image) await tx.insert(badgeImages).values({ badgeId: badge.id, ...image });
    return { ok: true as const, badge };
  });
}

/** Changes a badge. Its kind and code stay fixed. An image of undefined keeps, and null removes, the current one. */
export async function updateBadge(id: string, input: BadgeUpdateInput): Promise<boolean> {
  const { nameAr, nameEn, challengeAr, challengeEn, icon, isActive, image } = input;
  return db.transaction(async (tx) => {
    const rows = await tx
      .update(badges)
      .set({
        nameAr,
        nameEn,
        challengeAr,
        challengeEn,
        icon,
        isActive,
        ...(image === undefined ? {} : { imageUpdatedAt: image ? new Date() : null }),
      })
      .where(eq(badges.id, id))
      .returning({ id: badges.id });
    if (rows.length === 0) return false;
    if (image === null) await tx.delete(badgeImages).where(eq(badgeImages.badgeId, id));
    if (image) {
      await tx
        .insert(badgeImages)
        .values({ badgeId: id, ...image })
        .onConflictDoUpdate({ target: badgeImages.badgeId, set: image });
    }
    return true;
  });
}

/** Switches a badge on or off, leaving everything else as it is. Returns false if it does not exist. */
export async function setBadgeActive(id: string, isActive: boolean): Promise<boolean> {
  const rows = await db.update(badges).set({ isActive }).where(eq(badges.id, id)).returning({ id: badges.id });
  return rows.length > 0;
}

/** Deletes a badge unless a visitor earned it. */
export async function deleteBadge(id: string): Promise<DeleteOutcome> {
  const badge = await getBadge(id);
  if (!badge) return { ok: false, code: ERROR_CODES.notFound };
  const earned =
    badge.kind === BADGE_KINDS_BY_NAME.allDays
      ? await countAllDaysEarners()
      : (await db.select({ value: count() }).from(badgeClaims).where(eq(badgeClaims.badgeId, id)))[0].value;
  if (earned > 0) return { ok: false, code: ERROR_CODES.inUse, links: [{ type: "badge_claims", count: earned }] };
  try {
    await db.delete(badges).where(eq(badges.id, id));
    return { ok: true };
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error;
    return { ok: false, code: ERROR_CODES.inUse, links: [{ type: "badge_claims", count: 1 }] };
  }
}
