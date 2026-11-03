// Confirms Arabic and English messages have the same keys and no empty values.
import { describe, expect, it } from "vitest";
import { getMessages } from "@/config/messages";

/** Flattens a nested messages object into dotted key and value pairs. */
function flatten(value: unknown, prefix = ""): [string, string][] {
  if (typeof value === "string") return [[prefix, value]];
  return Object.entries(value as object).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages", () => {
  const ar = flatten(getMessages("ar"));
  const en = flatten(getMessages("en"));

  it("has the same keys in both languages", () => {
    expect(ar.map(([key]) => key).sort()).toEqual(en.map(([key]) => key).sort());
  });

  it("has no empty values", () => {
    expect([...ar, ...en].filter(([, value]) => !value.trim())).toEqual([]);
  });

  it("really holds different text per language", () => {
    expect(getMessages("ar").nav.agenda).not.toBe(getMessages("en").nav.agenda);
  });
});
