// The screen shown when a page fails unexpectedly.
"use client";

import { Slashes } from "@/components/Slashes";
import { DEFAULT_LOCALE, isLocale } from "@/config/locales";
import { getMessages } from "@/config/messages";
import { useParams } from "next/navigation";

/** Explains the failure and offers a retry. */
export default function PageError({ reset }: { reset: () => void }) {
  const raw = String(useParams().locale ?? "");
  const text = getMessages(isLocale(raw) ? raw : DEFAULT_LOCALE);
  return (
    <main className="page">
      <div className="band claim">
        <Slashes />
        <div className="content claim-inner">
          <h1>{text.errors.SERVER}</h1>
          <button type="button" className="button button--light" onClick={reset}>
            {text.claim.retry}
          </button>
        </div>
      </div>
    </main>
  );
}
