// Describes why an item cannot be deleted, so the admin screen can name what it is linked to.
import type { ErrorCode } from "@/config/literals";

export type DeleteLink =
  | { type: "agenda_item"; nameAr: string; nameEn: string; day: number; startTime: string }
  | { type: "attendance_code"; date: string }
  | { type: "check_ins"; date: string; count: number }
  | { type: "coin_claims"; count: number }
  | { type: "badge_claims"; count: number };

export type DeleteOutcome = { ok: true } | { ok: false; code: ErrorCode; links?: DeleteLink[] };

const FOREIGN_KEY_VIOLATION = "23503";

/** Tells whether a database error means a row is still linked to, or links to a missing, row. */
export function isForeignKeyViolation(error: unknown): boolean {
  const failure = error as { code?: string; cause?: { code?: string } } | null;
  return failure?.code === FOREIGN_KEY_VIOLATION || failure?.cause?.code === FOREIGN_KEY_VIOLATION;
}
