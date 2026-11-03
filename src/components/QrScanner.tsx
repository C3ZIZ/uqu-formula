// Reads QR codes with the phone camera, with manual typing as a fallback.
"use client";

import { LIMITS } from "@/config/limits";
import type { Messages } from "@/config/messages";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field, FieldError } from "./Field";

interface QrScannerProps {
  onResult: (text: string) => void;
  text: Messages["scanner"];
  error?: string;
}

const SCAN_WIDTH = 480;

/** Shows the camera view and reports each code it reads, along with a typed-code form. */
export function QrScanner({ onResult, text, error }: QrScannerProps) {
  const video = useRef<HTMLVideoElement>(null);
  const report = useRef(onResult);
  const [cameraState, setCameraState] = useState<"starting" | "running" | "denied">("starting");

  useEffect(() => {
    report.current = onResult;
  }, [onResult]);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stream: MediaStream | undefined;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    /** Starts the rear camera and repeatedly checks frames for a QR code. */
    async function start() {
      try {
        const { default: jsQR } = await import("jsqr");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (stopped || !video.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.current.srcObject = stream;
        await video.current.play();
        setCameraState("running");

        /** Checks one frame, then schedules the next. */
        const scan = () => {
          const element = video.current;
          if (stopped || !element || !context) return;
          if (element.videoWidth > 0) {
            canvas.width = SCAN_WIDTH;
            canvas.height = Math.round((element.videoHeight / element.videoWidth) * SCAN_WIDTH);
            context.drawImage(element, 0, 0, canvas.width, canvas.height);
            const frame = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
            if (code?.data) report.current(code.data);
          }
          timer = setTimeout(scan, LIMITS.scanIntervalMs);
        };
        scan();
      } catch {
        if (!stopped) setCameraState("denied");
      }
    }

    start();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  /** Sends a typed code the same way as a scanned one. */
  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get("code") ?? "").trim();
    if (value) report.current(value);
    form.reset();
  }

  return (
    <div className="scanner">
      <div className="scanner-view">
        <video ref={video} playsInline muted aria-hidden="true" />
        <span className="scanner-frame" aria-hidden="true" />
        {cameraState !== "running" ? (
          <p className="scanner-message" role="status">
            {cameraState === "denied" ? text.denied : text.starting}
          </p>
        ) : null}
      </div>
      <FieldError id="scanner-error" message={error} />
      <form className="scanner-manual" onSubmit={submitManual}>
        <Field name="code" label={text.manualLabel} autoComplete="off" autoCapitalize="characters" latin />
        <button type="submit" className="button">
          {text.manualSubmit}
        </button>
      </form>
    </div>
  );
}
