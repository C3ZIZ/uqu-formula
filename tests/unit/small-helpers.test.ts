// Tests small helpers: dates, redirects, scanned text, generated codes, and QR output.
import { describe, expect, it } from "vitest";
import { CODE_KINDS } from "@/config/literals";
import { generateCode } from "@/lib/codes";
import { agendaOpenDay, riyadhDate } from "@/lib/dates";
import { qrSvg } from "@/lib/qr";
import { normalizeCode, parseScanTarget } from "@/lib/qr-payload";
import { safeNextPath } from "@/lib/safe-redirect";

describe("agendaOpenDay", () => {
  it("opens today's section during the event", () => {
    expect(agendaOpenDay("2026-12-14")).toBe(2);
  });

  it("opens the first day at any other time", () => {
    expect(agendaOpenDay("2026-11-04")).toBe(1);
  });
});

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

describe("parseScanTarget", () => {
  it("recognizes a coin link", () => {
    expect(parseScanTarget("https://site.example/scan/UQU-PIT-7K3Q9M")).toEqual({ kind: "coin", token: "UQU-PIT-7K3Q9M" });
  });

  it("recognizes an attendance link", () => {
    expect(parseScanTarget("https://site.example/en/attend/UQU-GRID-7K3Q9M")).toEqual({
      kind: "attendance",
      token: "UQU-GRID-7K3Q9M",
    });
  });

  it("reads a language link with extra parameters", () => {
    expect(parseScanTarget("https://site.example/en/scan/UQU-PODIUM-7K3Q9M?x=1")?.token).toBe("UQU-PODIUM-7K3Q9M");
  });

  it("sends a typed code to the scan screen, which routes it", () => {
    expect(parseScanTarget("uqu grid 7k3q9m")).toEqual({ kind: "coin", token: "UQU-GRID-7K3Q9M" });
  });

  it.each(["hello world", "https://evil.com/phish", "", "FW!", "ABCD2345EFGH", "UQU-RACER-7K3Q9M", "UQU-PIT-7K3"])(
    "rejects %s",
    (value) => {
      expect(parseScanTarget(value)).toBeNull();
    },
  );
});

describe("normalizeCode", () => {
  it.each([
    ["UQU-GRID-7K3Q9M", "UQU-GRID-7K3Q9M"],
    ["  uqu-grid-7k3q9m ", "UQU-GRID-7K3Q9M"],
    ["uqugrid7k3q9m", "UQU-GRID-7K3Q9M"],
    ["UQU PODIUM 7K3Q9M", "UQU-PODIUM-7K3Q9M"],
    ["uqu-pit-٧k٣q٩m", "UQU-PIT-7K3Q9M"],
  ])("reads %s the same way", (typed, expected) => {
    expect(normalizeCode(typed)).toBe(expected);
  });

  it("leaves unrelated text compact and uppercase", () => {
    expect(normalizeCode(" fw-abc ")).toBe("FWABC");
  });
});

describe("generated codes", () => {
  it.each([
    [CODE_KINDS.visitor, /^UQU-RACER-[2-9A-HJKMNP-TV-Z]{6}$/],
    [CODE_KINDS.coin, /^UQU-PIT-[2-9A-HJKMNP-TV-Z]{6}$/],
    [CODE_KINDS.attendance, /^UQU-GRID-[2-9A-HJKMNP-TV-Z]{6}$/],
    [CODE_KINDS.badge, /^UQU-PODIUM-[2-9A-HJKMNP-TV-Z]{6}$/],
  ])("makes a %s code in the right format", (kind, pattern) => {
    expect(generateCode(kind)).toMatch(pattern);
  });

  it("rarely repeats", () => {
    const tokens = new Set(Array.from({ length: 500 }, () => generateCode(CODE_KINDS.coin)));
    expect(tokens.size).toBe(500);
  });

  it("keeps a generated code unchanged when it is read back", () => {
    const token = generateCode(CODE_KINDS.badge);
    expect(normalizeCode(token)).toBe(token);
    expect(parseScanTarget(token)?.token).toBe(token);
  });
});

describe("qrSvg", () => {
  it("returns an SVG", async () => {
    expect(await qrSvg("hello")).toContain("<svg");
  });
});
