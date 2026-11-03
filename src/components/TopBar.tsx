// The top bar with the logo and language switch.
import type { Locale } from "@/config/locales";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import Link from "next/link";
import { LocaleSwitch } from "./LocaleSwitch";
import { Logo } from "./Logo";

/** Shows the event identity and the language switch. */
export function TopBar({ locale }: { locale: Locale }) {
  const text = getMessages(locale);
  return (
    <header className="topbar no-print">
      <Link className="brand" href={localePath(locale, PAGE_ROUTES.home)}>
        <Logo size={22} />
        <span>{text.brand.name}</span>
      </Link>
      <LocaleSwitch locale={locale} label={text.nav.switchLocale} />
    </header>
  );
}
