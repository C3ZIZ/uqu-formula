// Tests that registration survives a generated visitor code that is already taken.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { registerUser } from "@/services/users";
import { makeUser, resetDatabase } from "./helpers";

const nextCodes = vi.hoisted(() => [] as string[]);

vi.mock("@/lib/codes", async (original) => {
  const actual = await original<typeof import("@/lib/codes")>();
  return { ...actual, generateCode: (kind: never) => nextCodes.shift() ?? actual.generateCode(kind) };
});

const INPUT = { name: "Sara", email: "sara@example.com", phone: "0501234567", password: "password-123" };

describe("registering when a visitor code collides", () => {
  beforeEach(resetDatabase);

  it("tries again with a new code", async () => {
    const existing = await makeUser();
    nextCodes.push(existing.badgeCode);
    const result = await registerUser(INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.badgeCode).not.toBe(existing.badgeCode);
  });

  it("still reports a taken email", async () => {
    await registerUser(INPUT);
    expect(await registerUser(INPUT)).toEqual({ ok: false, code: "EMAIL_TAKEN" });
  });
});
