// The screen a daily attendance QR opens. Logged-out visitors log in first and come back here.
import { AttendanceResult } from "@/components/AttendanceResult";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { requireSession } from "@/lib/auth";
import { pageLocale } from "@/lib/page";

interface AttendProps {
  params: Promise<{ locale: string; token: string }>;
}

/** Requires login, then lets the browser send the check-in, so link previews cannot trigger it. */
export default async function AttendPage({ params }: AttendProps) {
  const locale = await pageLocale(params);
  const { token } = await params;
  const decoded = decodeURIComponent(token);
  await requireSession(locale, localePath(locale, PAGE_ROUTES.attend(decoded)));
  const text = getMessages(locale);
  return (
    <main className="page">
      <AttendanceResult locale={locale} token={decoded} text={text.attendance} errors={text.errors} />
    </main>
  );
}
