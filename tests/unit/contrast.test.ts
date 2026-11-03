// Checks that every text and background color pair used in the design meets WCAG AA.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CSS = readFileSync("src/styles/tokens.css", "utf8");

/** Reads a hex color token from the stylesheet. */
function token(name: string): string {
  const match = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`missing token ${name}`);
  return match[1];
}

/** Calculates a color's relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Calculates the contrast ratio between two colors. */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const PAIRS = [
  ["white", "ink"],
  ["white", "deep"],
  ["black", "teal"],
  ["black", "taupe"],
  ["taupe", "ink"],
  ["ink", "paper"],
  ["ink", "white"],
  ["deep", "paper"],
  ["muted", "paper"],
  ["muted-on-dark", "ink"],
];

describe("color contrast", () => {
  it.each(PAIRS)("%s text on %s meets 4.5:1", (text, background) => {
    expect(contrast(token(text), token(background))).toBeGreaterThanOrEqual(4.5);
  });

  it("uses the exact identity colors", () => {
    expect([token("ink"), token("deep"), token("teal"), token("taupe")]).toEqual([
      "#0c272c",
      "#2a636d",
      "#358b9a",
      "#9f895c",
    ]);
  });
});
