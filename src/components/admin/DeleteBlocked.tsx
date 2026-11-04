// The warning shown when an item cannot be deleted, naming everything linked to it.
import { CircleAlert } from "lucide-react";
import type { Locale } from "@/config/locales";
import type { Messages } from "@/config/messages";
import { formatEventDate } from "@/lib/dates";
import type { DeleteLink } from "@/lib/delete-links";
import { pickLocalized } from "@/lib/localized";

interface DeleteBlockedProps {
  locale: Locale;
  links: DeleteLink[];
  text: Messages["admin"]["deleteBlocked"];
}

/** Writes one linked item as a line of text. */
function LinkLine({ link, locale, text }: { link: DeleteLink; locale: Locale; text: DeleteBlockedProps["text"] }) {
  switch (link.type) {
    case "agenda_item":
      return (
        <>
          {text.agendaItem}: <b>{pickLocalized(locale, link.nameAr, link.nameEn)}</b> ({text.day}{" "}
          <span className="numeric">{link.day}</span> · <span className="numeric">{link.startTime}</span>)
        </>
      );
    case "attendance_code":
      return (
        <>
          {text.attendanceCode}: <b>{formatEventDate(link.date, locale)}</b>
        </>
      );
    case "check_ins":
      return (
        <>
          {formatEventDate(link.date, locale)} · {text.checkIns}: <b className="numeric">{link.count}</b>
        </>
      );
    case "coin_claims":
      return (
        <>
          {text.coinClaims}: <b className="numeric">{link.count}</b>
        </>
      );
    case "badge_claims":
      return (
        <>
          {text.badgeClaims}: <b className="numeric">{link.count}</b>
        </>
      );
  }
}

/** Lists the links and says what the admin can do next. */
export function DeleteBlocked({ locale, links, text }: DeleteBlockedProps) {
  const isPlace = links.some((link) => link.type === "agenda_item" || link.type === "attendance_code");
  return (
    <div className="form-error delete-blocked" role="alert">
      <CircleAlert size={20} aria-hidden="true" />
      <div>
        <b>{text.title}</b>
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <LinkLine link={link} locale={locale} text={text} />
            </li>
          ))}
        </ul>
        <p>{isPlace ? text.moveHint : text.stopHint}</p>
      </div>
    </div>
  );
}
