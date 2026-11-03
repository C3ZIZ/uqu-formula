// Date and time helpers that always use the venue's time zone.
import { EVENT } from "@/config/event";
import { LOCALE_TAGS, type Locale } from "@/config/locales";

/** Returns the calendar date at the venue as YYYY-MM-DD. */
export function riyadhDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT.timeZone }).format(now);
}

/** Returns the clock time at the venue as HH:MM. */
export function riyadhClock(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT.timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

/** Formats a moment as a short date and time at the venue. */
export function formatDateTime(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    timeZone: EVENT.timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

/** Formats an event day date, such as the weekday with day and month. */
export function formatEventDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00Z`));
}
