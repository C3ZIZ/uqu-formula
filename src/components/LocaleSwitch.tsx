// Switches language on the current page and remembers the choice.
"use client";

import { COOKIES } from "@/config/literals";
import { LOCALES, type Locale } from "@/config/locales";
import { switchLocalePath } from "@/config/routes";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ONE_YEAR_SECONDS = 31_536_000;

/** Renders the link to the other language, keeping the current page and query. */
function LocaleLink({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const other = LOCALES.find((item) => item !== locale) ?? locale;
  const href = switchLocalePath(pathname, other) + (query ? `?${query}` : "");

  /** Saves the chosen language for later visits and scanned links. */
  function remember() {
    document.cookie = `${COOKIES.locale}=${other}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  }

  return (
    <a className="locale-switch" href={href} lang={other} hrefLang={other} onClick={remember}>
      {label}
    </a>
  );
}

/** Wraps the link so reading the query string does not block page rendering. */
export function LocaleSwitch({ locale, label }: { locale: Locale; label: string }) {
  return (
    <Suspense>
      <LocaleLink locale={locale} label={label} />
    </Suspense>
  );
}
