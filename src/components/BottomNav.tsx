// The fixed bottom navigation on phones.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { Coins, IdCard, MapPinned, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanButton } from "./ScanButton";

const START_ITEMS = [
  { key: "agenda", path: PAGE_ROUTES.agenda, Icon: Timer },
  { key: "map", path: PAGE_ROUTES.map, Icon: MapPinned },
] as const;

const END_ITEMS = [
  { key: "badge", path: PAGE_ROUTES.badge, Icon: IdCard },
  { key: "coins", path: PAGE_ROUTES.coins, Icon: Coins },
] as const;

interface BottomNavProps {
  locale: Locale;
  text: Messages["nav"];
  scannerText: Messages["scanner"];
}

/** Shows four main sections with the one scan button between them. */
export function BottomNav({ locale, text, scannerText }: BottomNavProps) {
  const pathname = usePathname();

  /** Draws one section link and marks it when current. */
  function renderItem({ key, path, Icon }: (typeof START_ITEMS)[number] | (typeof END_ITEMS)[number]) {
    const href = localePath(locale, path);
    return (
      <li key={key}>
        <Link href={href} aria-current={pathname === href ? "page" : undefined}>
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
          <span>{text[key]}</span>
        </Link>
      </li>
    );
  }

  return (
    <nav className="bottom-nav no-print" aria-label={text.mainNavigation}>
      <ul>
        {START_ITEMS.map(renderItem)}
        <li>
          <ScanButton locale={locale} label={text.scan} text={scannerText} />
        </li>
        {END_ITEMS.map(renderItem)}
      </ul>
    </nav>
  );
}
