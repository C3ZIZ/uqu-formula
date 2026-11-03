// The interactive venue map screen.
import { PageBand } from "@/components/PageBand";
import { VenueMap, type MapZone } from "@/components/VenueMap";
import { getMessages } from "@/config/messages";
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

/** Loads zones with their sessions and shows the map. */
export default async function MapPage({ params }: LocaleProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const [zones, agenda] = await Promise.all([getZones(), getAgenda()]);

  const mapZones: MapZone[] = zones.map((zone) => ({
    id: zone.id,
    type: zone.type,
    name: pickLocalized(locale, zone.nameAr, zone.nameEn),
    details: pickLocalized(locale, zone.detailsAr, zone.detailsEn),
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    sessions: agenda
      .filter((item) => item.zoneId === zone.id)
      .map((item) => ({
        id: item.id,
        day: item.day,
        startTime: item.startTime,
        title: pickLocalized(locale, item.titleAr, item.titleEn),
      })),
  }));

  return (
    <main className="page">
      <PageBand title={text.map.title} lead={text.map.lead} />
      <VenueMap zones={mapZones} text={text.map} dayLabel={text.agenda.day} />
    </main>
  );
}
