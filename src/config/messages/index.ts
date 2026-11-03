// Loads the text for a language. All user-visible text in the site comes from here.
import type { Locale } from "../locales";
import { ar, type Messages } from "./ar";
import { en } from "./en";

export type { Messages };

const MESSAGES: Record<Locale, Messages> = { ar, en };

/** Returns all text for one language. */
export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale];
}
