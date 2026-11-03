// The agenda screen: sessions for each event day.
import { AgendaDays, type AgendaEntry } from "@/components/AgendaDays";
import { PageBand } from "@/components/PageBand";
import { EVENT } from "@/config/event";
import { getMessages } from "@/config/messages";
import { formatEventDate, riyadhClock, riyadhDate } from "@/lib/dates";
import { pickLocalized } from "@/lib/localized";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { getAgenda } from "@/services/agenda";
import { getZones } from "@/services/zones";

// Serve this page from a shared cache and refresh it every few seconds, since all visitors see the same content.
export const revalidate = 20;

/** No pages are prebuilt, because the database is not available during the image build. */
export function generateStaticParams() {
  return [];
}

/** Loads the agenda and shows it, opening on today during the event. */
export default async function AgendaPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const [items, zones] = await Promise.all([getAgenda(), getZones()]);
  const zoneNames = new Map(zones.map((zone) => [zone.id, pickLocalized(locale, zone.nameAr, zone.nameEn)]));
  const today = riyadhDate();
  const clock = riyadhClock();
  const todayNumber = EVENT.days.find((day) => day.date === today)?.number;

  const entries: AgendaEntry[] = items.map((item) => ({
    id: item.id,
    day: item.day,
    startTime: item.startTime,
    endTime: item.endTime,
    title: pickLocalized(locale, item.titleAr, item.titleEn),
    details: pickLocalized(locale, item.detailsAr, item.detailsEn),
    zoneId: item.zoneId,
    zoneName: item.zoneId ? (zoneNames.get(item.zoneId) ?? null) : null,
    isNow: item.day === todayNumber && item.startTime <= clock && clock < item.endTime,
  }));

  return (
    <main className="page">
      <PageBand title={text.agenda.title} lead={text.agenda.lead} />
      <AgendaDays
        locale={locale}
        entries={entries}
        days={EVENT.days.map((day) => ({ number: day.number, label: formatEventDate(day.date, locale) }))}
        initialDay={todayNumber ?? EVENT.days[0].number}
        text={text.agenda}
      />
    </main>
  );
}
