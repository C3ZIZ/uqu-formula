// The tappable venue map, with a sheet of details that rises from the bottom.
"use client";

import { MAP_GRID } from "@/config/event";
import { QUERY_PARAMS, type ZoneType } from "@/config/literals";
import type { Messages } from "@/config/messages";
import { X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

export interface MapZone {
  id: string;
  type: ZoneType;
  name: string;
  details: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sessions: { id: string; day: number; startTime: string; title: string }[];
}

interface VenueMapProps {
  zones: MapZone[];
  text: Messages["map"];
  dayLabel: string;
}

/** Converts a position on the map grid into percent styles. Physical sides keep the map the same in both languages. */
export function zoneStyle(zone: Pick<MapZone, "x" | "y" | "width" | "height">) {
  return {
    left: `${(zone.x / MAP_GRID.width) * 100}%`,
    top: `${(zone.y / MAP_GRID.height) * 100}%`,
    width: `${(zone.width / MAP_GRID.width) * 100}%`,
    height: `${(zone.height / MAP_GRID.height) * 100}%`,
  };
}

/** Opens the zone named in the address, as agenda links do. It runs in the browser so the page itself can be cached. */
function ZoneFromAddress({ onFound }: { onFound: (zoneId: string) => void }) {
  const zoneId = useSearchParams().get(QUERY_PARAMS.zone);
  useEffect(() => {
    if (zoneId) onFound(zoneId);
  }, [zoneId, onFound]);
  return null;
}

/** Shows the map and a list of the same zones for easier reading. */
export function VenueMap({ zones, text, dayLabel }: VenueMapProps) {
  const [selectedId, setSelectedId] = useState<string>();
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = zones.find((zone) => zone.id === selectedId);

  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);

  /** Closes the sheet. */
  const close = useCallback(() => {
    dialog.current?.close();
    setSelectedId(undefined);
  }, []);

  return (
    <div className="map-screen">
      <Suspense>
        <ZoneFromAddress onFound={setSelectedId} />
      </Suspense>
      <div className="map-canvas" dir="ltr" style={{ aspectRatio: `${MAP_GRID.width} / ${MAP_GRID.height}` }}>
        <svg className="map-track" viewBox={`0 0 ${MAP_GRID.width} ${MAP_GRID.height}`} aria-hidden="true">
          <path d="M3 32 C3 2 10 2 50 2 S97 2 97 32 V110 C97 136 90 138 74 138 H26 C10 138 3 136 3 110 Z" />
        </svg>
        {zones.map((zone) => (
          <button
            key={zone.id}
            type="button"
            className={`map-zone map-zone--${zone.type}`}
            style={zoneStyle(zone)}
            aria-haspopup="dialog"
            onClick={() => setSelectedId(zone.id)}
          >
            <span dir="auto">{zone.name}</span>
          </button>
        ))}
      </div>
      <p className="map-notice content">{text.sampleNotice}</p>

      <section className="content section">
        <h2 className="section-title">{text.listTitle}</h2>
        <ul className="rows">
          {zones.map((zone) => (
            <li key={zone.id}>
              <button type="button" className="zone-row" onClick={() => setSelectedId(zone.id)}>
                <span className={`zone-swatch map-zone--${zone.type}`} aria-hidden="true" />
                <span className="zone-row-name">{zone.name}</span>
                <span className="lead">{text.types[zone.type]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <dialog
        ref={dialog}
        className="sheet"
        onCancel={close}
        onClose={() => setSelectedId(undefined)}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
        aria-labelledby="zone-sheet-title"
      >
        {selected ? (
          <div className="sheet-body">
            <div className="sheet-head">
              <div>
                <p className="sheet-type">{text.types[selected.type]}</p>
                <h2 id="zone-sheet-title">{selected.name}</h2>
              </div>
              <button type="button" className="icon-button" onClick={close} aria-label={text.close}>
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            {selected.details ? <p>{selected.details}</p> : null}
            <h3 className="sheet-subtitle">{text.inThisZone}</h3>
            {selected.sessions.length === 0 ? <p className="lead">{text.noItems}</p> : null}
            <ul className="rows">
              {selected.sessions.map((session) => (
                <li key={session.id} className="sheet-session">
                  <span className="numeric">{session.startTime}</span>
                  <span>
                    {session.title}
                    <span className="lead sheet-day">
                      {" · "}
                      {dayLabel} <span className="numeric">{session.day}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
