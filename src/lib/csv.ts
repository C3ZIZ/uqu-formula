// Builds CSV files that Excel opens correctly and safely.
const BYTE_ORDER_MARK = "﻿";
const FORMULA_START = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\n\r]/;

/** Makes one cell safe: blocks spreadsheet formulas and quotes special characters. */
function cell(value: string | number): string {
  if (typeof value === "number") return String(value);
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Turns rows into CSV text with a byte-order mark so Arabic displays correctly. */
export function toCsv(rows: (string | number)[][]): string {
  return BYTE_ORDER_MARK + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
