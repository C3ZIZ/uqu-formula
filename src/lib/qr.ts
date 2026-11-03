// Draws QR codes as SVG on the server.
import QRCode from "qrcode";
import { QR_OPTIONS } from "@/config/literals";

/** Returns SVG markup for a QR code holding the given text. */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: QR_OPTIONS.margin,
    errorCorrectionLevel: QR_OPTIONS.errorCorrectionLevel,
    color: { dark: QR_OPTIONS.darkColor, light: QR_OPTIONS.lightColor },
  });
}
