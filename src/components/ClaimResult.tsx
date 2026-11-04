// Sends one coin claim and shows the outcome.
"use client";

import { CLAIM_STATUS, type ClaimStatus } from "@/config/literals";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES, localePath, PAGE_ROUTES } from "@/config/routes";
import { sendJson } from "@/lib/client-api";
import { CircleCheck, CircleX, History } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CoinCount } from "./CoinCount";
import { Slashes } from "./Slashes";
import { StartLights } from "./StartLights";

interface ClaimResultProps {
  locale: Locale;
  token: string;
  text: Messages["claim"];
  errors: Messages["errors"];
  unit: string;
}

interface ClaimReply {
  status: ClaimStatus;
  coins: number;
  total: number;
}

/** Claims the code on arrival. The ref stops a repeat request when React re-runs the effect. */
export function ClaimResult({ locale, token, text, errors, unit }: ClaimResultProps) {
  const [reply, setReply] = useState<ClaimReply>();
  const [failure, setFailure] = useState<string>();
  const sent = useRef(false);

  /** Sends the claim and stores the reply or the error text. */
  const claim = useCallback(async () => {
    setFailure(undefined);
    const result = await sendJson<ClaimReply>(API_ROUTES.coinClaim, "POST", { token });
    if (result.ok) setReply(result.data);
    else setFailure((errors as Record<string, string>)[result.error] ?? errors.SERVER);
  }, [errors, token]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void claim();
  }, [claim]);

  const coinsPath = localePath(locale, PAGE_ROUTES.coins);

  return (
    <div className="band claim" aria-live="polite">
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

        {reply?.status === CLAIM_STATUS.claimed ? (
          <>
            <CircleCheck size={56} strokeWidth={1.5} aria-hidden="true" />
            <p className="claim-label">{text.claimed}</p>
            <h1 className="claim-coins">
              <span className="numeric">+</span>
              <CoinCount value={reply.coins} />
              <span className="coins-unit">{unit}</span>
            </h1>
          </>
        ) : null}

        {reply?.status === CLAIM_STATUS.already ? (
          <>
            <History size={56} strokeWidth={1.5} aria-hidden="true" />
            <h1>{text.already}</h1>
            <p className="lead">{text.alreadyLead}</p>
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
          <>
            <p className="claim-total">
              {text.newTotal} <b className="numeric">{reply.total}</b> {unit}
            </p>
            <Link className="button button--accent" href={coinsPath}>
              {text.toCoins}
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
