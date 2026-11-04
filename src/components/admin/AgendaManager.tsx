// The admin screen for agenda items, with one section per event day.
"use client";

import { EVENT } from "@/config/event";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES } from "@/config/routes";
import { formatEventDate } from "@/lib/dates";
import { pickLocalized } from "@/lib/localized";
import type { AgendaItem } from "@/services/agenda";
import type { Zone } from "@/services/zones";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { ResourceManager, type FieldSpec } from "./ResourceManager";

interface AgendaManagerProps {
  locale: Locale;
  items: AgendaItem[];
  zones: Pick<Zone, "id" | "nameAr" | "nameEn">[];
  text: Messages["admin"];
  errors: Messages["errors"];
  fieldErrors: Messages["fieldErrors"];
  dayLabel: string;
  openDay: number;
}

/** Shows one collapsible section per event day, each with its items in time order. */
export function AgendaManager({ locale, items, zones, text, errors, fieldErrors, dayLabel, openDay }: AgendaManagerProps) {
  const [openDays, setOpenDays] = useState<number[]>([openDay]);
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

  /** Opens or closes one day's section. */
  function toggleDay(day: number) {
    setOpenDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  }

  return (
    <div className="agenda-days">
      {EVENT.days.map((day) => {
        const dayItems = items.filter((item) => item.day === day.number);
        const isOpen = openDays.includes(day.number);
        const panelId = `agenda-day-${day.number}`;
        return (
          <section key={day.number} className="agenda-day">
            <button
              type="button"
              className="agenda-day-toggle"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggleDay(day.number)}
            >
              <span className="agenda-day-name">
                <b>{dayLabel} <span className="numeric">{day.number}</span></b>
                <span className="lead">{formatEventDate(day.date, locale)}</span>
              </span>
              <span className="agenda-day-count">
                <span className="numeric">{dayItems.length}</span> {text.agendaCount}
              </span>
              <ChevronDown className="agenda-day-chevron" size={22} aria-hidden="true" />
            </button>
            <div id={panelId} className="agenda-day-panel" hidden={!isOpen}>
              <ResourceManager
                locale={locale}
                items={dayItems}
                fields={fields}
                emptyValues={{ titleAr: "", titleEn: "", detailsAr: "", detailsEn: "", day: String(day.number), startTime: "", endTime: "", zoneId: "" }}
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
                      <span className="numeric">{item.startTime}–{item.endTime}</span>
                      {item.zoneId ? ` · ${zoneName.get(item.zoneId) ?? ""}` : ""}
                    </p>
                  </div>
                )}
                text={text}
                errors={errors}
                fieldErrors={fieldErrors}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
