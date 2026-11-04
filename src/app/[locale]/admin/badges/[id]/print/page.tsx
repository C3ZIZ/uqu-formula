// A printable page for one challenge badge's QR code.
import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/admin/PrintButton";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { getEnv } from "@/lib/env";
import { pickLocalized } from "@/lib/localized";
import { pageLocale } from "@/lib/page";
import { qrSvg } from "@/lib/qr";
import { getBadge } from "@/services/badges";

interface PrintProps {
  params: Promise<{ locale: string; id: string }>;
}

/** Shows the code large, with the badge's name and typed fallback. The all-days badge has no code. */
export default async function PrintBadgePage({ params }: PrintProps) {
  const locale = await pageLocale(params);
  const { id } = await params;
  const badge = z.uuid().safeParse(id).success ? await getBadge(id) : undefined;
  if (!badge?.token) notFound();
  const text = getMessages(locale);
  const qr = await qrSvg(`${getEnv().APP_URL}${PAGE_ROUTES.scan(badge.token)}`);

  return (
    <main className="page print-page">
      <div className="content print-sheet">
        <Logo size={44} />
        <h1>{pickLocalized(locale, badge.nameAr, badge.nameEn)}</h1>
        <p>{pickLocalized(locale, badge.challengeAr, badge.challengeEn)}</p>
        <div className="print-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <p>{text.admin.badges.printHint}</p>
        <p className="numeric code-token">{badge.token}</p>
      </div>
      <div className="content actions no-print print-actions">
        <PrintButton label={text.admin.coinCodes.printButton} />
        <Link className="text-action" href={localePath(locale, PAGE_ROUTES.adminBadges)}>
          {text.admin.coinCodes.back}
        </Link>
      </div>
    </main>
  );
}
