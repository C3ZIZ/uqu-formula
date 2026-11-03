// The fixed bottom navigation on phones.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { Coins, Flag, IdCard, MapPinned, Timer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { key: "home", path: PAGE_ROUTES.home, Icon: Flag },
  { key: "agenda", path: PAGE_ROUTES.agenda, Icon: Timer },
  { key: "map", path: PAGE_ROUTES.map, Icon: MapPinned },
  { key: "badge", path: PAGE_ROUTES.badge, Icon: IdCard },
  { key: "coins", path: PAGE_ROUTES.coins, Icon: Coins },
] as const;

/** Shows the five main sections and marks the current one. */
export function BottomNav({ locale, text }: { locale: Locale; text: Messages["nav"] }) {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav no-print" aria-label={text.mainNavigation}>
      <ul>
        {ITEMS.map(({ key, path, Icon }) => {
          const href = localePath(locale, path);
          return (
            <li key={key}>
              <Link href={href} aria-current={pathname === href ? "page" : undefined}>
                <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
                <span>{text[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
