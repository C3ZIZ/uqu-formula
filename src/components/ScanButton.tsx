// A button that opens the full-screen scanner for coin or attendance codes.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { parseScanTarget, type ScanKind } from "@/lib/qr-payload";
import { ScanLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QrScanner } from "./QrScanner";

interface ScanButtonProps {
  locale: Locale;
  expected: ScanKind;
  scanLabel: string;
  text: Messages["scanner"];
}

/** Opens the camera and moves to the matching screen once a code is read. */
export function ScanButton({ locale, expected, scanLabel, text }: ScanButtonProps) {
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

  /** Accepts a code, or explains that it was not recognized. */
  function handleResult(value: string) {
    const target = parseScanTarget(value, expected);
    if (!target) {
      setError(text.notRecognized);
      return;
    }
    const route = target.kind === "coin" ? PAGE_ROUTES.scan(target.token) : PAGE_ROUTES.attend(target.token);
    router.push(localePath(locale, route));
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
