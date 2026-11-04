// Shrinks a picture in the browser before upload, so any phone photo fits the size limit.
import { LIMITS } from "@/config/limits";

const WEBP = "image/webp";
const JPEG = "image/jpeg";
const QUALITY = 0.85;

export interface ShrunkImage {
  base64: string;
  previewUrl: string;
}

/** Splits a data address into its type and its encoded bytes. */
function readDataUrl(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  return { base64, isWebp: header.includes(WEBP), bytes: (base64.length * 3) / 4 };
}

/** Draws the picture at no more than the allowed side. It returns null if the file cannot be read as a picture. */
export async function shrinkImage(file: File): Promise<ShrunkImage | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, LIMITS.badgeImageMaxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    // Some browsers cannot write WebP and fall back to a larger PNG, so JPEG is the last resort.
    let previewUrl = canvas.toDataURL(WEBP, QUALITY);
    if (!readDataUrl(previewUrl).isWebp && readDataUrl(previewUrl).bytes > LIMITS.badgeImageMaxBytes) {
      previewUrl = canvas.toDataURL(JPEG, QUALITY);
    }
    const { base64, bytes } = readDataUrl(previewUrl);
    return bytes <= LIMITS.badgeImageMaxBytes ? { base64, previewUrl } : null;
  } catch {
    return null;
  }
}
