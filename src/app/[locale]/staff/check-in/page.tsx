// The staff check-in screen.
import { CheckInDesk } from "@/components/CheckInDesk";
import { PageBand } from "@/components/PageBand";
import { getMessages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { requireRole, STAFF_ROLES } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { countCheckInsToday } from "@/services/checkins";

/** Shows the scanner to staff and admins only. */
export default async function CheckInPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  await requireRole(locale, localePath(locale, PAGE_ROUTES.staffCheckIn), STAFF_ROLES);
  const text = getMessages(locale);
  return (
    <main className="page">
      <PageBand title={text.staff.title} lead={text.staff.lead} />
      <CheckInDesk
        locale={locale}
        initialCount={await countCheckInsToday()}
        text={text.staff}
        scannerText={text.scanner}
        errors={text.errors}
      />
    </main>
  );
}
