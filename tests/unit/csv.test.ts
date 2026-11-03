// Tests CSV output for Excel compatibility and formula safety.
import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("starts with a byte-order mark so Excel reads Arabic correctly", () => {
    expect(toCsv([["سارة"]]).charCodeAt(0)).toBe(0xfeff);
  });

  it("quotes commas, quotes, and line breaks", () => {
    expect(toCsv([['a,b', 'say "hi"', "x\ny"]]).slice(1)).toBe('"a,b","say ""hi""","x\ny"');
  });

  it.each(["=SUM(A1)", "+1+1", "-2", "@cmd", "\tx"])("neutralizes the formula %s", (value) => {
    expect(toCsv([[value]]).slice(1)).toContain(`'${value}`);
  });

  it("keeps numbers as numbers", () => {
    expect(toCsv([[42, "a"]]).slice(1)).toBe("42,a");
  });
});
