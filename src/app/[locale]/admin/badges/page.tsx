// The admin page for badges.
import { PageBand } from "@/components/PageBand";
import { BadgesManager } from "@/components/admin/BadgesManager";
import { getMessages } from "@/config/messages";
import { requireAdmin } from "@/lib/auth";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { listBadges } from "@/services/badges";

/** Lists the badges and how many visitors earned each. */
export default async function AdminBadgesPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  await requireAdmin(locale);
  const text = getMessages(locale);
  return (
    <main className="page">
      <PageBand title={text.admin.sections.badges} lead={text.admin.badges.lead} />
      <BadgesManager
        locale={locale}
        items={await listBadges()}
        text={text.admin}
        errors={text.errors}
        fieldErrors={text.fieldErrors}
      />
    </main>
  );
}
