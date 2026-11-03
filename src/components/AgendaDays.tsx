// Day tabs and the timed list of sessions, laid out like a timing screen.
"use client";

import { QUERY_PARAMS } from "@/config/literals";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { localePath, PAGE_ROUTES } from "@/config/routes";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export interface AgendaEntry {
  id: string;
  day: number;
  startTime: string;
  endTime: string;
  title: string;
  details: string;
  zoneId: string | null;
  zoneName: string | null;
  isNow: boolean;
}

interface AgendaDaysProps {
  locale: Locale;
  entries: AgendaEntry[];
  days: { number: number; label: string }[];
  initialDay: number;
  text: Messages["agenda"];
}

/** Shows one day at a time. Switching days needs no page load. */
export function AgendaDays({ locale, entries, days, initialDay, text }: AgendaDaysProps) {
  const [day, setDay] = useState(initialDay);
  const visible = entries.filter((entry) => entry.day === day);

  return (
    <div className="content agenda">
      <div className="day-tabs" role="tablist" aria-label={text.title}>
        {days.map((item) => (
          <button
            key={item.number}
            type="button"
            role="tab"
            aria-selected={item.number === day}
            className="day-tab"
            onClick={() => setDay(item.number)}
          >
            <span className="day-tab-name">
              {text.day} <b className="numeric">{item.number}</b>
            </span>
            <span className="day-tab-date">{item.label}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" key={day} className="agenda-panel">
        {visible.length === 0 ? <p className="lead">{text.empty}</p> : null}
        <ol className="timing">
          {visible.map((entry) => (
            <li key={entry.id} className={entry.isNow ? "timing-row is-now" : "timing-row"}>
              <div className="timing-time numeric">
                <span>{entry.startTime}</span>
                <span className="timing-end">{entry.endTime}</span>
              </div>
              <div className="timing-body">
                {entry.isNow ? <span className="now-mark">{text.now}</span> : null}
                <h2>{entry.title}</h2>
                {entry.details ? <p className="lead">{entry.details}</p> : null}
                {entry.zoneId && entry.zoneName ? (
                  <Link
                    className="zone-link"
                    href={`${localePath(locale, PAGE_ROUTES.map)}?${new URLSearchParams({ [QUERY_PARAMS.zone]: entry.zoneId })}`}
                  >
                    <MapPin size={16} aria-hidden="true" />
                    {entry.zoneName}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
