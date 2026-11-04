// Tests that uploaded badge images are judged by their content, not by what they claim to be.
import { describe, expect, it } from "vitest";
import { LIMITS } from "@/config/limits";
import { parseBadgeImage } from "@/lib/badge-image";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const WEBP = [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")];

/** Encodes bytes the way the browser sends them. */
function encode(bytes: number[], extra = 16): string {
  return Buffer.from([...bytes, ...new Array(extra).fill(1)]).toString("base64");
}

describe("parseBadgeImage", () => {
  it.each([
    ["PNG", PNG, "image/png"],
    ["JPEG", JPEG, "image/jpeg"],
    ["WebP", WEBP, "image/webp"],
  ])("accepts %s by its first bytes", (_name, bytes, contentType) => {
    expect(parseBadgeImage(encode(bytes))?.contentType).toBe(contentType);
  });

  it("returns the decoded bytes", () => {
    const parsed = parseBadgeImage(encode(PNG, 4));
    expect(parsed?.data).toEqual(Buffer.from([...PNG, 1, 1, 1, 1]));
  });

  it.each([
    ["an SVG", Buffer.from("<svg onload=alert(1)></svg>").toString("base64")],
    ["HTML", Buffer.from("<html></html>").toString("base64")],
    ["a truncated PNG header", Buffer.from(PNG.slice(0, 3)).toString("base64")],
    ["text that is not base64", "not base64!!"],
    ["nothing", ""],
  ])("rejects %s", (_name, value) => {
    expect(parseBadgeImage(value)).toBeNull();
  });

  it("rejects an image over the size limit", () => {
    expect(parseBadgeImage(encode(PNG, LIMITS.badgeImageMaxBytes))).toBeNull();
  });
});
