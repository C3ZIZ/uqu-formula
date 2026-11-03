// Event facts and map settings. The dates are sample values until the client confirms them.
export const EVENT = {
  timeZone: "Asia/Riyadh",
  days: [
    { number: 1, date: "2026-12-13" },
    { number: 2, date: "2026-12-14" },
    { number: 3, date: "2026-12-15" },
  ],
} as const;

export const DAY_NUMBERS = EVENT.days.map((day) => day.number);

// The venue map is drawn on a portrait grid so zones stay large on phones.
export const MAP_GRID = { width: 100, height: 140 } as const;
