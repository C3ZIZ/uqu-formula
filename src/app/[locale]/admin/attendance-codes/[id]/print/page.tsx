// A printable page for one daily attendance QR code.
import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/admin/PrintButton";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { formatEventDate } from "@/lib/dates";
import { getEnv } from "@/lib/env";
import { pickLocalized } from "@/lib/localized";
import { requireAdmin } from "@/lib/auth";
import { pageLocale } from "@/lib/page";
import { qrSvg } from "@/lib/qr";
import { getAttendanceCode } from "@/services/attendance-codes";

interface PrintProps {
  params: Promise<{ locale: string; id: string }>;
}

/** Shows the code large, with its date, place, and typed fallback. */
export default async function PrintAttendanceCodePage({ params }: PrintProps) {
  const locale = await pageLocale(params);
  await requireAdmin(locale);
  const { id } = await params;
  const code = z.uuid().safeParse(id).success ? await getAttendanceCode(id) : undefined;
  if (!code) notFound();
  const text = getMessages(locale);
  const qr = await qrSvg(`${getEnv().APP_URL}${PAGE_ROUTES.attend(code.token)}`);

  return (
    <main className="page print-page">
      <div className="content print-sheet">
        <Logo size={44} />
        <h1>{text.admin.attendanceCodes.printTitle}</h1>
        <p className="print-coins">{formatEventDate(code.eventDate, locale)}</p>
        {code.zoneNameAr ? <p>{pickLocalized(locale, code.zoneNameAr, code.zoneNameEn ?? "")}</p> : null}
        <div className="print-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <p>{text.admin.attendanceCodes.printHint}</p>
        <p className="numeric code-token">{code.token}</p>
      </div>
      <div className="content actions no-print print-actions">
        <PrintButton label={text.admin.coinCodes.printButton} />
        <Link className="text-action" href={localePath(locale, PAGE_ROUTES.adminAttendanceCodes)}>
          {text.admin.coinCodes.back}
        </Link>
      </div>
    </main>
  );
}
