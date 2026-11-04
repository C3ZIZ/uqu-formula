// Accounts: registration, login with lockout, password reset, and registrant lists.
import { createHash, randomBytes } from "node:crypto";
import { and, count, countDistinct, desc, eq, gt, ilike, isNull, or, sql, sum } from "drizzle-orm";
import { LIMITS } from "@/config/limits";
import { CODE_KINDS, ERROR_CODES, ROLES, type Role } from "@/config/literals";
import { db } from "@/db/client";
import { checkIns, coinClaims, passwordResets, users } from "@/db/schema";
import { generateCode } from "@/lib/codes";
import { riyadhDate } from "@/lib/dates";
import { hashPassword, verifyPassword } from "@/lib/password";
import { toLatinDigits, type RegisterInput } from "@/lib/validation";

export type User = typeof users.$inferSelect;

const LAST_ADMIN_LOCK = 7201;

// Compared against when an email is unknown, so timing does not reveal registered emails.
let decoyHash: Promise<string> | undefined;

/** Creates a visitor account. Database rules reject a repeated email, and a repeated visitor code gets a new try. */
export async function registerUser(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);
  for (let attempt = 0; attempt < LIMITS.registerCodeAttempts; attempt += 1) {
    const [user] = await db
      .insert(users)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        badgeCode: generateCode(CODE_KINDS.visitor),
      })
      .onConflictDoNothing()
      .returning();
    if (user) return { ok: true as const, user };
    const [taken] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
    if (taken) return { ok: false as const, code: ERROR_CODES.emailTaken };
  }
  throw new Error("could not find a free visitor code");
}

/** Records one failed login and locks the account once it reaches the limit. */
async function recordFailedLogin(userId: string): Promise<void> {
  const expired = sql`${users.lockedUntil} IS NOT NULL AND ${users.lockedUntil} <= now()`;
  await db
    .update(users)
    .set({
      failedLogins: sql`CASE WHEN ${expired} THEN 1 ELSE ${users.failedLogins} + 1 END`,
      lockedUntil: sql`CASE
        WHEN ${expired} THEN NULL
        WHEN ${users.failedLogins} + 1 >= ${LIMITS.loginMaxFailures} THEN now() + make_interval(mins => ${LIMITS.lockMinutes})
        ELSE ${users.lockedUntil} END`,
    })
    .where(eq(users.id, userId));
}

/** Checks a login. Every failure gives the same answer, so it reveals nothing about the account. */
export async function authenticate(email: string, password: string) {
  const failure = { ok: false as const, code: ERROR_CODES.invalidCredentials };
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    decoyHash ??= hashPassword(randomBytes(16).toString("hex"));
    await verifyPassword(password, await decoyHash);
    return failure;
  }
  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (user.lockedUntil && user.lockedUntil > new Date()) return failure;
  if (!passwordMatches) {
    await recordFailedLogin(user.id);
    return failure;
  }
  if (user.failedLogins > 0 || user.lockedUntil) {
    await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  }
  return { ok: true as const, user };
}

/** Loads one user by id. */
export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

/** Hashes a reset token for storage, so a database leak exposes no working links. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a reset token for an email, or returns null if the email is unknown. */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!user) return null;
  const token = randomBytes(LIMITS.resetTokenBytes).toString("base64url");
  await db.insert(passwordResets).values({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + LIMITS.resetTokenMinutes * 60_000),
  });
  return token;
}

/** Sets a new password if the token is valid, unused, and unexpired. Also clears any login lock. */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);
  return db.transaction(async (tx) => {
    const [reset] = await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResets.tokenHash, hashToken(token)),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, new Date()),
        ),
      )
      .returning({ userId: passwordResets.userId });
    if (!reset) return false;
    await tx.update(users).set({ passwordHash, failedLogins: 0, lockedUntil: null }).where(eq(users.id, reset.userId));
    return true;
  });
}

/** Changes a role. The lock stops two admins from removing each other at the same moment. */
export async function setUserRole(userId: string, role: Role) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${LAST_ADMIN_LOCK})`);
    const [user] = await tx.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return { ok: false as const, code: ERROR_CODES.notFound };
    if (user.role === ROLES.admin && role !== ROLES.admin) {
      const [admins] = await tx.select({ value: count() }).from(users).where(eq(users.role, ROLES.admin));
      if (admins.value <= 1) return { ok: false as const, code: ERROR_CODES.lastAdmin };
    }
    await tx.update(users).set({ role }).where(eq(users.id, userId));
    return { ok: true as const };
  });
}

const registrantColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  phone: users.phone,
  role: users.role,
  createdAt: users.createdAt,
  attendanceDays: sql<number>`(SELECT count(*)::int FROM ${checkIns} WHERE ${checkIns.userId} = ${users.id})`,
  coins: sql<number>`(SELECT coalesce(sum(${coinClaims.coins}), 0)::int FROM ${coinClaims} WHERE ${coinClaims.userId} = ${users.id})`,
};

/** Builds the search filter, treating wildcard characters as plain text. */
function searchFilter(search: string) {
  const term = toLatinDigits(search.trim()).replace(/[\\%_]/g, "\\$&");
  if (!term) return undefined;
  const pattern = `%${term}%`;
  return or(ilike(users.name, pattern), ilike(users.email, pattern), ilike(users.phone, pattern));
}

/** Returns one page of registrants with their attendance and coins. */
export async function listRegistrants({ search, page }: { search: string; page: number }) {
  const filter = searchFilter(search);
  const [rows, [totals]] = await Promise.all([
    db
      .select(registrantColumns)
      .from(users)
      .where(filter)
      .orderBy(desc(users.createdAt))
      .limit(LIMITS.registrantsPageSize)
      .offset((Math.max(page, 1) - 1) * LIMITS.registrantsPageSize),
    db.select({ value: count() }).from(users).where(filter),
  ]);
  return { rows, total: totals.value };
}

/** Returns all registrants for the CSV export. */
export async function listAllRegistrants() {
  return db.select(registrantColumns).from(users).orderBy(desc(users.createdAt));
}

/** Returns the dashboard totals, separating registered people from people who attended. */
export async function getOverviewCounts(now: Date = new Date()) {
  const [[registered], [today], [ever], [coins]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(checkIns).where(eq(checkIns.eventDate, riyadhDate(now))),
    db.select({ value: countDistinct(checkIns.userId) }).from(checkIns),
    db.select({ total: sum(coinClaims.coins), claims: count() }).from(coinClaims),
  ]);
  return {
    registered: registered.value,
    attendedToday: today.value,
    attendedEver: ever.value,
    coinsIssued: Number(coins.total ?? 0),
    claims: coins.claims,
  };
}
