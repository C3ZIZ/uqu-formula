// Sends one badge claim and shows the outcome.
"use client";

import { CLAIM_STATUS, type ClaimStatus } from "@/config/literals";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { pickLocalized } from "@/lib/localized";
import { CircleCheck, CircleX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeMedal } from "./BadgeMedal";
import { Slashes } from "./Slashes";
import { StartLights } from "./StartLights";

const VIBRATE_MS = 120;
const MEDAL_SIZE = 112;

interface BadgeResultProps {
  locale: Locale;
  token: string;
  text: Messages["badgeClaim"];
  errors: Messages["errors"];
}

interface BadgeReply {
  status: ClaimStatus;
  badge?: { id: string; nameAr: string; nameEn: string; icon: string; imageUpdatedAt: string | null };
}

/** Claims the badge on arrival. The ref stops a repeat request when React re-runs the effect. */
export function BadgeResult({ locale, token, text, errors }: BadgeResultProps) {
  const [reply, setReply] = useState<BadgeReply>();
  const [failure, setFailure] = useState<string>();
  const sent = useRef(false);

  /** Sends the claim and stores the reply or the error text. */
  const claim = useCallback(async () => {
    setFailure(undefined);
    const result = await sendJson<BadgeReply>(API_ROUTES.badgeClaim, "POST", { token });
    if (result.ok) {
      setReply(result.data);
      if (result.data.status === CLAIM_STATUS.claimed) navigator.vibrate?.(VIBRATE_MS);
    } else setFailure((errors as Record<string, string>)[result.error] ?? errors.SERVER);
  }, [errors, token]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void claim();
  }, [claim]);

  return (
    <div className="band claim" aria-live="polite">
      {reply?.status === CLAIM_STATUS.claimed ? (
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
            <button type="button" className="button button--light" onClick={() => void claim()}>
              {text.retry}
            </button>
          </>
        ) : null}

        {reply?.badge ? (
          <>
            <span className={reply.status === CLAIM_STATUS.claimed ? "medal-reveal" : undefined}>
              <BadgeMedal id={reply.badge.id} icon={reply.badge.icon} imageUpdatedAt={reply.badge.imageUpdatedAt} size={MEDAL_SIZE} />
            </span>
            <p className="claim-label">{reply.status === CLAIM_STATUS.claimed ? text.claimed : text.already}</p>
            <h1>{pickLocalized(locale, reply.badge.nameAr, reply.badge.nameEn)}</h1>
          </>
        ) : null}

        {reply?.status === CLAIM_STATUS.invalid ? (
          <>
            <CircleX size={56} strokeWidth={1.5} aria-hidden="true" />
            <h1>{text.invalid}</h1>
            <p className="lead">{text.invalidLead}</p>
          </>
        ) : null}

        {reply ? (
          <Link className="button button--accent" href={localePath(locale, PAGE_ROUTES.coins)}>
            {text.toCoins}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
