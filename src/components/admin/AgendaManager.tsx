// The admin screen for agenda items.
"use client";

import { EVENT } from "@/config/event";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES } from "@/config/routes";
import { pickLocalized } from "@/lib/localized";
import type { AgendaItem } from "@/services/agenda";
import type { Zone } from "@/services/zones";
import { ResourceManager, type FieldSpec } from "./ResourceManager";

interface AgendaManagerProps {
  locale: Locale;
  items: AgendaItem[];
  zones: Pick<Zone, "id" | "nameAr" | "nameEn">[];
  text: Messages["admin"];
  errors: Messages["errors"];
  fieldErrors: Messages["fieldErrors"];
  dayLabel: string;
}

/** Sets up the shared manager with agenda fields. */
export function AgendaManager({ locale, items, zones, text, errors, fieldErrors, dayLabel }: AgendaManagerProps) {
  const form = text.form;
  const zoneName = new Map(zones.map((zone) => [zone.id, pickLocalized(locale, zone.nameAr, zone.nameEn)]));
  const fields: FieldSpec[] = [
    { name: "titleAr", label: form.titleAr, kind: "text" },
    { name: "titleEn", label: form.titleEn, kind: "text" },
    { name: "detailsAr", label: form.detailsAr, kind: "textarea" },
    { name: "detailsEn", label: form.detailsEn, kind: "textarea" },
    {
      name: "day",
      label: form.day,
      kind: "select",
      options: EVENT.days.map((day) => ({ value: String(day.number), label: `${dayLabel} ${day.number}` })),
    },
    { name: "startTime", label: form.startTime, kind: "time", latin: true },
    { name: "endTime", label: form.endTime, kind: "time", latin: true },
    {
      name: "zoneId",
      label: form.zone,
      kind: "select",
      options: [{ value: "", label: form.noZone }, ...zones.map((zone) => ({ value: zone.id, label: zoneName.get(zone.id) ?? "" }))],
    },
  ];

  return (
    <ResourceManager
      items={items}
      fields={fields}
      emptyValues={{ titleAr: "", titleEn: "", detailsAr: "", detailsEn: "", day: "1", startTime: "", endTime: "", zoneId: "" }}
      createUrl={API_ROUTES.adminAgenda}
      itemUrl={API_ROUTES.adminAgendaItem}
      toValues={(item) => ({
        titleAr: item.titleAr,
        titleEn: item.titleEn,
        detailsAr: item.detailsAr,
        detailsEn: item.detailsEn,
        day: String(item.day),
        startTime: item.startTime,
        endTime: item.endTime,
        zoneId: item.zoneId ?? "",
      })}
      renderItem={(item) => (
        <div className="resource-item">
          <b>{pickLocalized(locale, item.titleAr, item.titleEn)}</b>
          <p className="lead">
            {dayLabel} <span className="numeric">{item.day}</span> · <span className="numeric">{item.startTime}–{item.endTime}</span>
            {item.zoneId ? ` · ${zoneName.get(item.zoneId) ?? ""}` : ""}
          </p>
        </div>
      )}
      text={text}
      errors={errors}
      fieldErrors={fieldErrors}
    />
  );
}
