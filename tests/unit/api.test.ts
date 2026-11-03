// Tests the API request guards: same-origin checks and body parsing.
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { isAllowedOrigin, readBody } from "@/lib/api";

/** Builds a test request with the given headers. */
function request(headers: Record<string, string>, body = "{}"): Request {
  return new Request("http://web:3000/x", { method: "POST", headers, body });
}

describe("isAllowedOrigin", () => {
  it("allows the same host", () => {
    expect(isAllowedOrigin(request({ origin: "https://site.example", host: "site.example" }))).toBe(true);
  });

  it("prefers the host forwarded by the proxy", () => {
    const headers = { origin: "https://site.example", host: "web:3000", "x-forwarded-host": "site.example" };
    expect(isAllowedOrigin(request(headers))).toBe(true);
  });

  it("blocks another site", () => {
    expect(isAllowedOrigin(request({ origin: "https://evil.example", host: "site.example" }))).toBe(false);
  });

  it("blocks a look-alike host", () => {
    expect(isAllowedOrigin(request({ origin: "https://site.example.evil.com", host: "site.example" }))).toBe(false);
  });

  it("blocks a malformed origin", () => {
    expect(isAllowedOrigin(request({ origin: "null", host: "site.example" }))).toBe(false);
  });

  it("allows requests with no origin, which browsers never send for cross-site posts", () => {
    expect(isAllowedOrigin(request({ host: "site.example" }))).toBe(true);
  });
});

describe("readBody", () => {
  const schema = z.object({ name: z.string() });

  it("returns valid data", async () => {
    const result = await readBody(request({ host: "a" }, '{"name":"x"}'), schema);
    expect(result).toEqual({ ok: true, data: { name: "x" } });
  });

  it("names the invalid field", async () => {
    const result = await readBody(request({ host: "a" }, '{"name":1}'), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(await result.response.json()).toEqual({ error: "VALIDATION", fields: ["name"] });
  });

  it("treats broken JSON as a validation error, not a crash", async () => {
    const result = await readBody(request({ host: "a" }, "{oops"), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });

  it("refuses another site before reading the body", async () => {
    const result = await readBody(request({ origin: "https://evil.example", host: "a" }, '{"name":"x"}'), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
});
