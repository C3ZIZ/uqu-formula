// The continuous badge scanner staff use at the entrance.
"use client";

import { LIMITS } from "@/config/limits";
import { CHECK_IN_STATUS, type CheckInStatus } from "@/config/literals";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { formatDateTime } from "@/lib/dates";
import { normalizeCode } from "@/lib/qr-payload";
import { CircleCheck, CircleX, History, ScanLine } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { QrScanner } from "./QrScanner";

interface CheckInReply {
  status: CheckInStatus;
  name?: string;
  at?: string;
  todayCount: number;
}

interface CheckInDeskProps {
  locale: Locale;
  initialCount: number;
  text: Messages["staff"];
  scannerText: Messages["scanner"];
  errors: Messages["errors"];
}

const VIBRATE_MS = 80;

/** Sends each scanned badge, ignoring the same code while it stays in view. */
export function CheckInDesk({ locale, initialCount, text, scannerText, errors }: CheckInDeskProps) {
  const [scanning, setScanning] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [reply, setReply] = useState<CheckInReply>();
  const [failure, setFailure] = useState<string>();
  const recent = useRef({ code: "", at: 0 });

  /** Handles one scanned or typed code. */
  const handleCode = useCallback(
    async (raw: string) => {
      const code = normalizeCode(raw);
      const now = Date.now();
      if (code === recent.current.code && now - recent.current.at < LIMITS.scanCooldownMs) return;
      recent.current = { code, at: now };
      const result = await sendJson<CheckInReply>(API_ROUTES.checkIn, "POST", { badgeCode: code });
      if (result.ok) {
        setFailure(undefined);
        setReply(result.data);
        setCount(result.data.todayCount);
        navigator.vibrate?.(VIBRATE_MS);
      } else {
        setReply(undefined);
        setFailure((errors as Record<string, string>)[result.error] ?? errors.SERVER);
      }
    },
    [errors],
  );

  return (
    <div className="content desk">
      <p className="desk-count">
        {text.todayCount} <b className="numeric">{count}</b>
      </p>

      <div className="desk-result" aria-live="assertive">
        {reply?.status === CHECK_IN_STATUS.checkedIn ? (
          <p className="result result--good">
            <CircleCheck size={28} aria-hidden="true" />
            <span>
              <b>{text.success}</b>
              <span className="result-name" dir="auto">{reply.name}</span>
            </span>
          </p>
        ) : null}
        {reply?.status === CHECK_IN_STATUS.already ? (
          <p className="result result--warn">
            <History size={28} aria-hidden="true" />
            <span>
              <b>{text.already}</b>
              <span className="result-name" dir="auto">{reply.name}</span>
              {reply.at ? <span>{text.alreadyAt} {formatDateTime(new Date(reply.at), locale)}</span> : null}
            </span>
          </p>
        ) : null}
        {reply?.status === CHECK_IN_STATUS.unknown ? (
          <p className="result result--bad">
            <CircleX size={28} aria-hidden="true" />
            <b>{text.unknown}</b>
          </p>
        ) : null}
        {failure ? (
          <p className="result result--bad">
            <CircleX size={28} aria-hidden="true" />
            <b>{failure}</b>
          </p>
        ) : null}
      </div>

      {scanning ? (
        <QrScanner onResult={handleCode} text={scannerText} />
      ) : (
        <button type="button" className="button button--block" onClick={() => setScanning(true)}>
          <ScanLine size={20} aria-hidden="true" />
          {text.start}
        </button>
      )}
    </div>
  );
}
