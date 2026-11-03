// Tests small helpers: dates, redirects, scanned text, generated codes, and QR output.
import { describe, expect, it } from "vitest";
import { CODE_ALPHABET } from "@/config/literals";
import { LIMITS } from "@/config/limits";
import { generateBadgeCode, generateCoinToken } from "@/lib/codes";
import { riyadhDate } from "@/lib/dates";
import { qrSvg } from "@/lib/qr";
import { normalizeCode, parseCoinPayload, parseScanTarget } from "@/lib/qr-payload";
import { safeNextPath } from "@/lib/safe-redirect";

describe("riyadhDate", () => {
  it("rolls over at Riyadh midnight, three hours before UTC midnight", () => {
    expect(riyadhDate(new Date("2026-12-13T20:59:00Z"))).toBe("2026-12-13");
    expect(riyadhDate(new Date("2026-12-13T21:00:00Z"))).toBe("2026-12-14");
  });
});

describe("safeNextPath", () => {
  it("keeps a path on this site", () => {
    expect(safeNextPath("/ar/scan/ABC", "/ar")).toBe("/ar/scan/ABC");
  });

  it("keeps the query string", () => {
    expect(safeNextPath("/ar/x?a=1", "/ar")).toBe("/ar/x?a=1");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "\\\\evil.com", "javascript:alert(1)", "", null, "/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "\t//evil.com", "/ /evil.com\u0000"])(
    "rejects %s",
    (value) => {
      expect(safeNextPath(value, "/ar")).toBe("/ar");
    },
  );
});

describe("parseCoinPayload", () => {
  it("accepts a bare token", () => {
    expect(parseCoinPayload("ABCD2345EFGH")).toBe("ABCD2345EFGH");
  });

  it("uppercases a typed token and trims it", () => {
    expect(parseCoinPayload("  abcd2345efgh ")).toBe("ABCD2345EFGH");
  });

  it("accepts a token typed with Arabic digits", () => {
    expect(parseCoinPayload("abcd٢٣٤٥efgh")).toBe("ABCD2345EFGH");
  });

  it("reads the token from a full link", () => {
    expect(parseCoinPayload("https://site.example/scan/ABCD2345EFGH")).toBe("ABCD2345EFGH");
  });

  it("reads the token from a language link", () => {
    expect(parseCoinPayload("https://site.example/en/scan/ABCD2345EFGH?x=1")).toBe("ABCD2345EFGH");
  });

  it.each(["hello world", "https://evil.com/phish", "", "FW!"])("rejects %s", (value) => {
    expect(parseCoinPayload(value)).toBeNull();
  });
});

describe("parseScanTarget", () => {
  it("recognizes a coin link", () => {
    expect(parseScanTarget("https://site.example/scan/ABCD2345EFGH")).toEqual({ kind: "coin", token: "ABCD2345EFGH" });
  });

  it("recognizes an attendance link", () => {
    expect(parseScanTarget("https://site.example/en/attend/ABCD2345EFGH")).toEqual({
      kind: "attendance",
      token: "ABCD2345EFGH",
    });
  });

  it("sends a typed code to the coin screen, which forwards attendance codes", () => {
    expect(parseScanTarget("abcd2345efgh")).toEqual({ kind: "coin", token: "ABCD2345EFGH" });
  });

  it.each(["hello world", "https://evil.com/phish", ""])("rejects %s", (value) => {
    expect(parseScanTarget(value)).toBeNull();
  });
});

describe("normalizeCode", () => {
  it("uppercases, trims, and removes dashes", () => {
    expect(normalizeCode(" fw-abc ")).toBe("FWABC");
  });

  it("converts Arabic digits typed on an Arabic keyboard", () => {
    expect(normalizeCode("fw٢٣-a٧")).toBe("FW23A7");
  });
});

describe("generated codes", () => {
  const allowed = new RegExp(`^[${CODE_ALPHABET}]+$`);

  it("makes coin tokens from the safe alphabet", () => {
    const token = generateCoinToken();
    expect(token).toHaveLength(LIMITS.coinCodeLength);
    expect(token).toMatch(allowed);
  });

  it("makes badge codes with the prefix", () => {
    expect(generateBadgeCode()).toMatch(/^FW[2-9A-Z]{10}$/);
  });

  it("does not repeat", () => {
    const tokens = new Set(Array.from({ length: 500 }, generateCoinToken));
    expect(tokens.size).toBe(500);
  });

  it("round-trips a generated token through the payload parser", () => {
    const token = generateCoinToken();
    expect(parseCoinPayload(token)).toBe(token);
  });
});

describe("qrSvg", () => {
  it("returns an SVG", async () => {
    expect(await qrSvg("hello")).toContain("<svg");
  });
});
