// Tests password hashing and checking.
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("passwords", () => {
  it("accepts the right password", async () => {
    expect(await verifyPassword("correct horse", await hashPassword("correct horse"))).toBe(true);
  });

  it("rejects the wrong password", async () => {
    expect(await verifyPassword("wrong", await hashPassword("correct horse"))).toBe(false);
  });

  it("gives two different hashes for one password", async () => {
    expect(await hashPassword("same")).not.toBe(await hashPassword("same"));
  });

  it("rejects a malformed stored hash without throwing", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
  });
});
