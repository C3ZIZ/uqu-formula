// Tests signing and reading of session tokens.
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/session-token";

const SESSION = { userId: "u1", name: "Sara", role: "visitor" as const };

describe("session tokens", () => {
  it("reads back what was signed", async () => {
    expect(await verifySession(await signSession(SESSION))).toEqual(SESSION);
  });

  it("rejects a tampered token", async () => {
    const token = await signSession(SESSION);
    const [head, , signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "u2", name: "x", role: "admin" })).toString("base64url");
    expect(await verifySession(`${head}.${forged}.${signature}`)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const expired = await new SignJWT({ name: "x", role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(secret);
    expect(await verifySession(expired)).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const other = await new SignJWT({ name: "x", role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-completely-different-secret-value-here"));
    expect(await verifySession(other)).toBeNull();
  });

  it("rejects garbage", async () => {
    expect(await verifySession("garbage")).toBeNull();
  });
});
