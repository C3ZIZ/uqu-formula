// The not-found wording, in the language of the address the visitor tried.
"use client";

import { DEFAULT_LOCALE, isLocale, type Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NotFoundTextProps {
  copies: Record<Locale, Messages["notFound"]>;
}

/** Picks the language from the address. The page itself cannot read it, because it receives no parameters. */
export function NotFoundText({ copies }: NotFoundTextProps) {
  const segment = usePathname().split("/")[1] ?? "";
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  const text = copies[locale];
  return (
    <div className="content off-track-text">
      <p className="off-track-code numeric">404</p>
      <h1>{text.title}</h1>
      <p className="lead">{text.lead}</p>
      <Link className="button button--accent" href={localePath(locale, PAGE_ROUTES.home)}>
        {text.back}
      </Link>
    </div>
  );
}
