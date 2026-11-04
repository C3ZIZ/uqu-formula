// The screen a coin or badge QR opens. Logged-out visitors log in first and come back here.
import { redirect } from "next/navigation";
import { BadgeResult } from "@/components/BadgeResult";
import { ClaimResult } from "@/components/ClaimResult";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { requireSession } from "@/lib/auth";
import { pageLocale } from "@/lib/page";
import { isAttendanceToken } from "@/services/attendance-codes";
import { isBadgeToken } from "@/services/badges";

interface ScanProps {
  params: Promise<{ locale: string; token: string }>;
}

/** Requires login, then lets the browser send the claim, so link previews cannot trigger it. */
export default async function ScanPage({ params }: ScanProps) {
  const locale = await pageLocale(params);
  const { token } = await params;
  await requireSession(locale, localePath(locale, PAGE_ROUTES.scan(decodeURIComponent(token))));
  if (await isAttendanceToken(decodeURIComponent(token))) {
    redirect(localePath(locale, PAGE_ROUTES.attend(decodeURIComponent(token))));
  }
  const text = getMessages(locale);
  if (await isBadgeToken(decodeURIComponent(token))) {
    return (
      <main className="page">
        <BadgeResult locale={locale} token={decodeURIComponent(token)} text={text.badgeClaim} errors={text.errors} />
      </main>
    );
  }
  return (
    <main className="page">
      <ClaimResult
        locale={locale}
        token={decodeURIComponent(token)}
        text={text.claim}
        errors={text.errors}
        unit={text.coins.unit}
      />
    </main>
  );
}
