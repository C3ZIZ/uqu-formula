// The one scan button in the bottom bar. It reads any site QR and opens the matching screen.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { parseScanTarget } from "@/lib/qr-payload";
import { ScanLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QrScanner } from "./QrScanner";

interface ScanButtonProps {
  locale: Locale;
  label: string;
  text: Messages["scanner"];
}

/** Opens the camera, then closes and moves on as soon as a code is read. */
export function ScanButton({ locale, label, text }: ScanButtonProps) {
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
    const target = parseScanTarget(value);
    if (!target) {
      setError(text.notRecognized);
      return;
    }
    const route = target.kind === "coin" ? PAGE_ROUTES.scan(target.token) : PAGE_ROUTES.attend(target.token);
    close();
    router.push(localePath(locale, route));
  }

  return (
    <>
      <button type="button" className="nav-scan" onClick={() => setOpen(true)}>
        <ScanLine size={26} aria-hidden="true" />
        <span>{label}</span>
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
