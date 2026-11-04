// The admin screen for map zones, including tap-to-place on the map.
"use client";

import { MAP_GRID } from "@/config/event";
import { ZONE_TYPES } from "@/config/literals";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { API_ROUTES } from "@/config/routes";
import { pickLocalized } from "@/lib/localized";
import type { Zone } from "@/services/zones";
import type { MouseEvent } from "react";
import { zoneStyle } from "../VenueMap";
import { ResourceManager, type FieldSpec, type FormValues } from "./ResourceManager";

interface ZonesManagerProps {
  locale: Locale;
  items: Zone[];
  text: Messages["admin"];
  typeLabels: Messages["map"]["types"];
  errors: Messages["errors"];
  fieldErrors: Messages["fieldErrors"];
}

const DEFAULT_ZONE = { x: 10, y: 10, width: 28, height: 20 };

/** Keeps a position inside the map once the zone's size is counted. */
function clampPosition(position: number, size: number, limit: number): number {
  return Math.round(Math.min(Math.max(position - size / 2, 0), Math.max(limit - size, 0)));
}

/** Shows the map and moves the edited zone to wherever the admin taps. */
function PlacementPreview({ items, values, setValues, hint }: {
  items: Zone[];
  values: FormValues;
  setValues: (changes: FormValues) => void;
  hint: string;
}) {
  const width = Number(values.width) || 0;
  const height = Number(values.height) || 0;
  const current = { x: Number(values.x) || 0, y: Number(values.y) || 0, width, height };

  /** Converts a tap into grid coordinates. */
  function place(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const tapX = ((event.clientX - box.left) / box.width) * MAP_GRID.width;
    const tapY = ((event.clientY - box.top) / box.height) * MAP_GRID.height;
    setValues({
      x: clampPosition(tapX, width, MAP_GRID.width),
      y: clampPosition(tapY, height, MAP_GRID.height),
    });
  }

  return (
    <div>
      <p className="field-label">{hint}</p>
      <div
        className="map-canvas placement"
        dir="ltr"
        style={{ aspectRatio: `${MAP_GRID.width} / ${MAP_GRID.height}` }}
        onClick={place}
      >
        {items.map((zone) => (
          <span key={zone.id} className="placement-other" style={zoneStyle(zone)} />
        ))}
        <span className="placement-current" style={zoneStyle(current)} />
      </div>
    </div>
  );
}

/** Sets up the shared manager with zone fields. */
export function ZonesManager({ locale, items, text, typeLabels, errors, fieldErrors }: ZonesManagerProps) {
  const form = text.form;
  const fields: FieldSpec[] = [
    { name: "nameAr", label: form.nameAr, kind: "text" },
    { name: "nameEn", label: form.nameEn, kind: "text" },
    { name: "detailsAr", label: form.detailsAr, kind: "textarea" },
    { name: "detailsEn", label: form.detailsEn, kind: "textarea" },
    { name: "type", label: form.type, kind: "select", options: ZONE_TYPES.map((type) => ({ value: type, label: typeLabels[type] })) },
    { name: "width", label: form.width, kind: "number", latin: true },
    { name: "height", label: form.height, kind: "number", latin: true },
  ];

  return (
    <ResourceManager
      locale={locale}
      items={items}
      fields={fields}
      emptyValues={{ nameAr: "", nameEn: "", detailsAr: "", detailsEn: "", type: ZONE_TYPES[0], ...DEFAULT_ZONE }}
      createUrl={API_ROUTES.adminZones}
      itemUrl={API_ROUTES.adminZone}
      toValues={(zone) => ({
        nameAr: zone.nameAr,
        nameEn: zone.nameEn,
        detailsAr: zone.detailsAr,
        detailsEn: zone.detailsEn,
        type: zone.type,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height,
      })}
      renderItem={(zone) => (
        <div className="resource-item">
          <b>{pickLocalized(locale, zone.nameAr, zone.nameEn)}</b>
          <p className="lead">{typeLabels[zone.type]}</p>
        </div>
      )}
      renderFormExtra={(values, setValues) => (
        <PlacementPreview items={items} values={values} setValues={setValues} hint={form.placeHint} />
      )}
      text={text}
      errors={errors}
      fieldErrors={fieldErrors}
    />
  );
}
