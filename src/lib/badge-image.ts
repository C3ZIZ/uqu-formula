// Checks uploaded badge images by their first bytes, so a file cannot pretend to be an image.
import { BADGE_IMAGE_TYPES } from "@/config/literals";
import { LIMITS } from "@/config/limits";

export interface BadgeImage {
  data: Buffer;
  contentType: string;
}

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const WEBP_RIFF = Buffer.from("RIFF");
const WEBP_MARK = Buffer.from("WEBP");
const WEBP_MARK_OFFSET = 8;

/** Works out the image type from its bytes, or returns null for anything else. */
function detectType(data: Buffer): string | null {
  if (data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return BADGE_IMAGE_TYPES.png;
  if (data.subarray(0, JPEG_SIGNATURE.length).equals(JPEG_SIGNATURE)) return BADGE_IMAGE_TYPES.jpeg;
  const isWebp =
    data.subarray(0, WEBP_RIFF.length).equals(WEBP_RIFF) &&
    data.subarray(WEBP_MARK_OFFSET, WEBP_MARK_OFFSET + WEBP_MARK.length).equals(WEBP_MARK);
  return isWebp ? BADGE_IMAGE_TYPES.webp : null;
}

/** Decodes an uploaded image, returning null if it is not an allowed image within the size limit. */
export function parseBadgeImage(base64: string): BadgeImage | null {
  if (!BASE64.test(base64)) return null;
  const data = Buffer.from(base64, "base64");
  if (data.length > LIMITS.badgeImageMaxBytes) return null;
  const contentType = detectType(data);
  return contentType ? { data, contentType } : null;
}
