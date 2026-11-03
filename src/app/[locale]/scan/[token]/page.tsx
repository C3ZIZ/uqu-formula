// The screen a coin QR opens. Logged-out visitors log in first and come back here.
import { ClaimResult } from "@/components/ClaimResult";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { requireSession } from "@/lib/auth";
import { pageLocale } from "@/lib/page";

interface ScanProps {
  params: Promise<{ locale: string; token: string }>;
}

/** Requires login, then lets the browser send the claim, so link previews cannot trigger it. */
export default async function ScanPage({ params }: ScanProps) {
  const locale = await pageLocale(params);
  const { token } = await params;
  await requireSession(locale, localePath(locale, PAGE_ROUTES.scan(decodeURIComponent(token))));
  const text = getMessages(locale);
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
