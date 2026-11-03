// The full-screen scanner a visitor opens from the coins screen.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { parseCoinPayload } from "@/lib/qr-payload";
import { ScanLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QrScanner } from "./QrScanner";

interface CoinScannerProps {
  locale: Locale;
  scanLabel: string;
  text: Messages["scanner"];
}

/** Opens the camera and moves to the claim screen when a coin code is read. */
export function CoinScanner({ locale, scanLabel, text }: CoinScannerProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  /** Closes the scanner and releases the camera. */
  function close() {
    dialog.current?.close();
    setOpen(false);
    setError(undefined);
  }

  /** Accepts a coin code, or explains that the code was not recognized. */
  function handleResult(value: string) {
    const token = parseCoinPayload(value);
    if (!token) {
      setError(text.notRecognized);
      return;
    }
    router.push(localePath(locale, PAGE_ROUTES.scan(token)));
  }

  return (
    <>
      <button type="button" className="button button--accent" onClick={() => setOpen(true)}>
        <ScanLine size={20} aria-hidden="true" />
        {scanLabel}
      </button>
      {open ? (
        <dialog ref={dialog} className="scanner-dialog" onCancel={close}>
          <div className="scanner-head">
            <h2>{text.title}</h2>
            <button type="button" className="icon-button" onClick={close} aria-label={text.close}>
              <X size={24} aria-hidden="true" />
            </button>
          </div>
          <QrScanner onResult={handleResult} text={text} error={error} />
        </dialog>
      ) : null}
    </>
  );
}
