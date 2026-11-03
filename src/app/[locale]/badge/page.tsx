// The electronic badge: name and personal QR on a real carbon backing.
import { CircleCheck, CircleDashed } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { Logo } from "@/components/Logo";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { requireUser } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { qrSvg } from "@/lib/qr";
import { hasCheckedIn } from "@/services/checkins";

/** Shows the logged-in visitor's badge. */
export default async function BadgePage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const user = await requireUser(locale, localePath(locale, PAGE_ROUTES.badge));
  const [qr, attended] = await Promise.all([qrSvg(user.badgeCode), hasCheckedIn(user.id)]);

  return (
    <main className="page badge-page">
      <div className="badge-pass">
        <div className="badge-head">
          <Logo size={30} />
          <span className="badge-role">{text.badge[user.role]}</span>
        </div>
        <h1 className="badge-name" dir="auto">{user.name}</h1>
        <div className="badge-qr" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label={text.badge.code} />
        <p className="badge-instruction">{text.badge.instruction}</p>
        <p className="badge-code">
          <span className="sr-only">{text.badge.code}: </span>
          <span className="numeric">{user.badgeCode}</span>
        </p>
        <p className="badge-status" role="status">
          {attended ? <CircleCheck size={20} aria-hidden="true" /> : <CircleDashed size={20} aria-hidden="true" />}
          {attended ? text.badge.attended : text.badge.notAttended}
        </p>
      </div>
      <div className="content badge-foot">
        <LogoutButton locale={locale} label={text.nav.logout} />
      </div>
    </main>
  );
}
