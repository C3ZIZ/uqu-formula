// Tests accounts, login lockout, password reset, and admin role rules.
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { LIMITS } from "@/config/limits";
import { db } from "@/db/client";
import { passwordResets, users } from "@/db/schema";
import {
  authenticate,
  getOverviewCounts,
  listRegistrants,
  registerUser,
  requestPasswordReset,
  resetPassword,
  setUserRole,
} from "@/services/users";
import { makeUser, resetDatabase } from "./helpers";

const INPUT = { name: "Sara", email: "sara@example.com", phone: "0501234567", password: "password-123" };
/** Tries to log in with a wrong password. */
const failLogin = (email: string) => authenticate(email, "wrong-password");

describe("registration", () => {
  beforeEach(resetDatabase);

  it("creates a visitor with a badge code", async () => {
    const result = await registerUser(INPUT);
    expect(result).toMatchObject({ ok: true, user: { role: "visitor" } });
    if (result.ok) expect(result.user.badgeCode).toMatch(/^FW/);
  });

  it("refuses the same email again", async () => {
    await registerUser(INPUT);
    expect(await registerUser(INPUT)).toEqual({ ok: false, code: "EMAIL_TAKEN" });
  });

  it("refuses two simultaneous registrations for one email", async () => {
    const results = await Promise.all([registerUser(INPUT), registerUser(INPUT)]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
  });
});

describe("login", () => {
  beforeEach(resetDatabase);

  it("accepts the right password", async () => {
    await registerUser(INPUT);
    expect((await authenticate(INPUT.email, INPUT.password)).ok).toBe(true);
  });

  it("rejects a wrong password and an unknown email the same way", async () => {
    await registerUser(INPUT);
    const wrong = await failLogin(INPUT.email);
    const unknown = await failLogin("nobody@example.com");
    expect(wrong).toEqual({ ok: false, code: "INVALID_CREDENTIALS" });
    expect(unknown).toEqual(wrong);
  });

  it("locks after too many failures, even for the right password", async () => {
    await registerUser(INPUT);
    for (let i = 0; i < LIMITS.loginMaxFailures; i += 1) await failLogin(INPUT.email);
    expect((await authenticate(INPUT.email, INPUT.password)).ok).toBe(false);
  });

  it("unlocks once the lock time has passed", async () => {
    await registerUser(INPUT);
    for (let i = 0; i < LIMITS.loginMaxFailures; i += 1) await failLogin(INPUT.email);
    await db.update(users).set({ lockedUntil: new Date(Date.now() - 1000) }).where(eq(users.email, INPUT.email));
    expect((await authenticate(INPUT.email, INPUT.password)).ok).toBe(true);
  });

  it("clears the failure count after success", async () => {
    await registerUser(INPUT);
    for (let i = 0; i < LIMITS.loginMaxFailures - 1; i += 1) await failLogin(INPUT.email);
    await authenticate(INPUT.email, INPUT.password);
    for (let i = 0; i < LIMITS.loginMaxFailures - 1; i += 1) await failLogin(INPUT.email);
    expect((await authenticate(INPUT.email, INPUT.password)).ok).toBe(true);
  });
});

describe("password reset", () => {
  beforeEach(resetDatabase);

  it("sets a new password with a valid token", async () => {
    await registerUser(INPUT);
    const token = await requestPasswordReset(INPUT.email);
    expect(await resetPassword(token!, "new-password-1")).toBe(true);
    expect((await authenticate(INPUT.email, "new-password-1")).ok).toBe(true);
    expect((await authenticate(INPUT.email, INPUT.password)).ok).toBe(false);
  });

  it("returns nothing for an unknown email", async () => {
    expect(await requestPasswordReset("nobody@example.com")).toBeNull();
  });

  it("stores only a hash of the token", async () => {
    await registerUser(INPUT);
    const token = await requestPasswordReset(INPUT.email);
    const [row] = await db.select().from(passwordResets);
    expect(row.tokenHash).not.toBe(token);
  });

  it("works only once", async () => {
    await registerUser(INPUT);
    const token = await requestPasswordReset(INPUT.email);
    await resetPassword(token!, "new-password-1");
    expect(await resetPassword(token!, "new-password-2")).toBe(false);
  });

  it("refuses an expired token", async () => {
    await registerUser(INPUT);
    const token = await requestPasswordReset(INPUT.email);
    await db.update(passwordResets).set({ expiresAt: new Date(Date.now() - 1000) });
    expect(await resetPassword(token!, "new-password-1")).toBe(false);
  });

  it("refuses a made-up token", async () => {
    expect(await resetPassword("made-up", "new-password-1")).toBe(false);
  });

  it("clears a login lock so the owner can get back in", async () => {
    await registerUser(INPUT);
    for (let i = 0; i < LIMITS.loginMaxFailures; i += 1) await failLogin(INPUT.email);
    const token = await requestPasswordReset(INPUT.email);
    await resetPassword(token!, "new-password-1");
    expect((await authenticate(INPUT.email, "new-password-1")).ok).toBe(true);
  });
});

describe("roles and registrant list", () => {
  beforeEach(resetDatabase);

  it("refuses to remove the last admin", async () => {
    const admin = await makeUser();
    await setUserRole(admin.id, "admin");
    expect(await setUserRole(admin.id, "visitor")).toEqual({ ok: false, code: "LAST_ADMIN" });
  });

  it("allows it when another admin remains", async () => {
    const [first, second] = [await makeUser(), await makeUser()];
    await setUserRole(first.id, "admin");
    await setUserRole(second.id, "admin");
    expect(await setUserRole(first.id, "staff")).toEqual({ ok: true });
  });

  it("searches by name, email, and phone", async () => {
    await registerUser(INPUT);
    await makeUser("other@example.com");
    expect((await listRegistrants({ search: "sara", page: 1 })).rows).toHaveLength(1);
    expect((await listRegistrants({ search: "OTHER@", page: 1 })).rows).toHaveLength(1);
    expect((await listRegistrants({ search: "050", page: 1 })).total).toBe(2);
  });

  it("treats search wildcards as plain text", async () => {
    await registerUser(INPUT);
    expect((await listRegistrants({ search: "%", page: 1 })).total).toBe(0);
  });

  it("counts registered people", async () => {
    await makeUser();
    expect((await getOverviewCounts()).registered).toBe(1);
  });
});
