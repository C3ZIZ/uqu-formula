// Tests input rules, including Arabic digits and email casing.
import { describe, expect, it } from "vitest";
import { agendaSchema, coinCodeSchema, registerSchema, toLatinDigits, zoneSchema } from "@/lib/validation";

const VALID = { name: "سارة", email: "Sara@Example.COM", phone: "٠٥٠١٢٣٤٥٦٧", password: "longenough" };

describe("registration rules", () => {
  it("converts Arabic digits in phone numbers", () => {
    expect(registerSchema.parse(VALID).phone).toBe("0501234567");
  });

  it("removes spaces and dashes from phone numbers", () => {
    expect(registerSchema.parse({ ...VALID, phone: "+966 50-123 4567" }).phone).toBe("+966501234567");
  });

  it("lowercases and trims emails", () => {
    expect(registerSchema.parse({ ...VALID, email: "  Sara@Example.COM " }).email).toBe("sara@example.com");
  });

  it("keeps Arabic names", () => {
    expect(registerSchema.parse(VALID).name).toBe("سارة");
  });

  it.each([
    ["short password", { password: "short" }],
    ["bad phone", { phone: "12ab" }],
    ["blank name", { name: "   " }],
    ["bad email", { email: "nope" }],
  ])("rejects %s", (_label, change) => {
    expect(registerSchema.safeParse({ ...VALID, ...change }).success).toBe(false);
  });
});

describe("digits", () => {
  it("converts Arabic and Persian digits", () => {
    expect(toLatinDigits("٠١٢٣٤٥٦٧٨٩ ۰۱۲")).toBe("0123456789 012");
  });
});

describe("admin content rules", () => {
  it("rejects coins of zero", () => {
    expect(coinCodeSchema.safeParse({ labelAr: "أ", labelEn: "a", coins: 0, isActive: true }).success).toBe(false);
  });

  it("accepts coins sent as form text", () => {
    expect(coinCodeSchema.parse({ labelAr: "أ", labelEn: "a", coins: "50", isActive: true }).coins).toBe(50);
  });

  it("rejects an agenda item that ends before it starts", () => {
    const item = { titleAr: "أ", titleEn: "a", day: 1, startTime: "10:00", endTime: "09:00", zoneId: null };
    expect(agendaSchema.safeParse(item).success).toBe(false);
  });

  it("rejects a zone outside the map", () => {
    const zone = { nameAr: "أ", nameEn: "a", type: "stage", x: 90, y: 10, width: 30, height: 20 };
    expect(zoneSchema.safeParse(zone).success).toBe(false);
  });
});
