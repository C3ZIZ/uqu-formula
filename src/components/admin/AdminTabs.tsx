// The scrolling tabs between admin sections.
"use client";

import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { key: "overview", path: PAGE_ROUTES.admin },
  { key: "registrants", path: PAGE_ROUTES.adminRegistrants },
  { key: "agenda", path: PAGE_ROUTES.adminAgenda },
  { key: "zones", path: PAGE_ROUTES.adminZones },
  { key: "coinCodes", path: PAGE_ROUTES.adminCoinCodes },
  { key: "attendanceCodes", path: PAGE_ROUTES.adminAttendanceCodes },
  { key: "badges", path: PAGE_ROUTES.adminBadges },
] as const;

interface AdminTabsProps {
  locale: Locale;
  text: Messages["admin"]["sections"];
  label: string;
}

/** Shows the admin sections and marks the current one. */
export function AdminTabs({ locale, text, label }: AdminTabsProps) {
  const pathname = usePathname();
  return (
    <nav className="admin-tabs no-print" aria-label={label}>
      {TABS.map(({ key, path }) => {
        const href = localePath(locale, path);
        return (
          <Link key={key} href={href} aria-current={pathname === href ? "page" : undefined}>
            {text[key]}
          </Link>
        );
      })}
    </nav>
  );
}
