// Opens the browser's print dialog.
"use client";

/** Prints the current page. */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
