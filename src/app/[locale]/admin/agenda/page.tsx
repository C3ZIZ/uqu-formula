// The admin agenda page.
import { PageBand } from "@/components/PageBand";
import { AgendaManager } from "@/components/admin/AgendaManager";
import { getMessages } from "@/config/messages";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { loadAgenda } from "@/services/agenda";
import { loadZones } from "@/services/zones";

/** Loads current agenda data, skipping the public cache so edits show at once. */
export default async function AdminAgendaPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const [items, zones] = await Promise.all([loadAgenda(), loadZones()]);
  return (
    <main className="page">
      <PageBand title={text.admin.sections.agenda} />
      <AgendaManager
        locale={locale}
        items={items}
        zones={zones.map(({ id, nameAr, nameEn }) => ({ id, nameAr, nameEn }))}
        text={text.admin}
        errors={text.errors}
        fieldErrors={text.fieldErrors}
        dayLabel={text.agenda.day}
      />
    </main>
  );
}
