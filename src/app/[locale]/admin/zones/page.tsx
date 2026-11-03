// The admin zones page.
import { PageBand } from "@/components/PageBand";
import { ZonesManager } from "@/components/admin/ZonesManager";
import { getMessages } from "@/config/messages";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { loadZones } from "@/services/zones";

/** Loads current zones, skipping the public cache so edits show at once. */
export default async function AdminZonesPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  return (
    <main className="page">
      <PageBand title={text.admin.sections.zones} />
      <ZonesManager
        locale={locale}
        items={await loadZones()}
        text={text.admin}
        typeLabels={text.map.types}
        errors={text.errors}
        fieldErrors={text.fieldErrors}
      />
    </main>
  );
}
