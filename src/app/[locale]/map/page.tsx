// The interactive venue map screen.
import { PageBand } from "@/components/PageBand";
import { VenueMap, type MapZone } from "@/components/VenueMap";
import { QUERY_PARAMS } from "@/config/literals";
import { getMessages } from "@/config/messages";
import { pickLocalized } from "@/lib/localized";
import { pageLocale, type LocaleProps } from "@/lib/page";
import { getAgenda } from "@/services/agenda";
import { getZones } from "@/services/zones";

interface MapProps extends LocaleProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Loads zones with their sessions and shows the map. */
export default async function MapPage({ params, searchParams }: MapProps) {
  const locale = await pageLocale(params);
  const text = getMessages(locale);
  const [zones, agenda] = await Promise.all([getZones(), getAgenda()]);
  const initialZone = (await searchParams)[QUERY_PARAMS.zone];

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
      <VenueMap zones={mapZones} initialZoneId={initialZone} text={text.map} dayLabel={text.agenda.day} />
    </main>
  );
}
