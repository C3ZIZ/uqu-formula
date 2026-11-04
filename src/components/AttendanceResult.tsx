// Sends one attendance check-in and shows the outcome.
"use client";

import { CHECK_IN_STATUS, type CheckInStatus } from "@/config/literals";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { formatDateTime } from "@/lib/dates";
import { pickLocalized } from "@/lib/localized";
import { CalendarX, CircleCheck, CircleX, History } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Slashes } from "./Slashes";
import { StartLights } from "./StartLights";

const VIBRATE_MS = 120;

interface AttendanceResultProps {
  locale: Locale;
  token: string;
  text: Messages["attendance"];
  errors: Messages["errors"];
}

interface CheckInReply {
  status: CheckInStatus;
  at?: string;
  allDaysBadge?: { nameAr: string; nameEn: string };
}

/** Checks in on arrival. The ref stops a repeat request when React re-runs the effect. */
export function AttendanceResult({ locale, token, text, errors }: AttendanceResultProps) {
  const [reply, setReply] = useState<CheckInReply>();
  const [failure, setFailure] = useState<string>();
  const sent = useRef(false);

  /** Sends the check-in and stores the reply or the error text. */
  const checkIn = useCallback(async () => {
    setFailure(undefined);
    const result = await sendJson<CheckInReply>(API_ROUTES.attendanceCheckIn, "POST", { token });
    if (result.ok) {
      setReply(result.data);
      if (result.data.status === CHECK_IN_STATUS.checkedIn) navigator.vibrate?.(VIBRATE_MS);
    } else setFailure((errors as Record<string, string>)[result.error] ?? errors.SERVER);
  }, [errors, token]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void checkIn();
  }, [checkIn]);

  return (
    <div className="band claim" aria-live="polite">
      {reply?.status === CHECK_IN_STATUS.checkedIn ? (
        <p className="toast" role="alert">
          <CircleCheck size={22} aria-hidden="true" />
          {text.alert}
        </p>
      ) : null}
      <Slashes />
      <div className="content claim-inner">
        {!reply && !failure ? (
          <>
            <StartLights />
            <p className="claim-working">{text.working}</p>
          </>
        ) : null}

        {failure ? (
          <>
            <CircleX size={56} strokeWidth={1.5} aria-hidden="true" />
            <h1>{failure}</h1>
            <button type="button" className="button button--light" onClick={() => void checkIn()}>
              {text.retry}
            </button>
          </>
        ) : null}

        {reply?.status === CHECK_IN_STATUS.checkedIn ? (
          <>
            <CircleCheck size={56} strokeWidth={1.5} aria-hidden="true" />
            <h1>{text.checkedIn}</h1>
            <p className="lead">{text.checkedInLead}</p>
            {reply.allDaysBadge ? (
              <p className="claim-total">
                {text.allDaysBadge}: <b>{pickLocalized(locale, reply.allDaysBadge.nameAr, reply.allDaysBadge.nameEn)}</b>
              </p>
            ) : null}
          </>
        ) : null}

        {reply?.status === CHECK_IN_STATUS.already ? (
          <>
            <History size={56} strokeWidth={1.5} aria-hidden="true" />
            <h1>{text.already}</h1>
            {reply.at ? (
              <p className="lead">
                {text.alreadyAt}: {formatDateTime(new Date(reply.at), locale)}
              </p>
            ) : null}
          </>
        ) : null}

        {reply?.status === CHECK_IN_STATUS.wrongDay ? (
          <>
            <CalendarX size={56} strokeWidth={1.5} aria-hidden="true" />
            <h1>{text.wrongDay}</h1>
            <p className="lead">{text.wrongDayLead}</p>
          </>
        ) : null}

        {reply?.status === CHECK_IN_STATUS.invalid ? (
          <>
            <CircleX size={56} strokeWidth={1.5} aria-hidden="true" />
            <h1>{text.invalid}</h1>
            <p className="lead">{text.invalidLead}</p>
          </>
        ) : null}

        {reply ? (
          <Link className="button button--accent" href={localePath(locale, PAGE_ROUTES.badge)}>
            {text.toBadge}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
