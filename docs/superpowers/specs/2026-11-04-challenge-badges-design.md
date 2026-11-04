# Challenge badges and safer admin: design

Date: 2026-11-04. Status: approved by the project owner in chat, who also authorized merging and deploying without a separate spec review.

## Goal

Add collectible challenge badges, make the admin harder to break by accident, simplify the agenda screen, and give the not-found page a Formula identity. The event has no organizers, so visitors do everything themselves.

## Decisions from the owner

- The electronic badge page stays exactly as it is, including its QR code and attendance line.
- The staff scanner and the staff role are removed.
- Attendance codes are linked to a map place.
- Challenge badges appear on the coins page, so the bottom bar keeps five items.
- A badge can use a ready icon or an uploaded image.
- Deleting a linked item is refused, and the warning names what it is linked to.

## Challenge badges

There are two kinds, chosen when the badge is created. The kind cannot change later.

| Kind | How a visitor earns it | QR code |
|---|---|---|
| Challenge | Scans the badge's code after finishing the challenge | Yes, printable and downloadable |
| All days | Automatically, once they have attended every date in `EVENT.days` | No. Only one such badge can exist |

Rules:

- A visitor earns a challenge badge once. A second scan reports that they already have it, and simultaneous scans count once.
- The all-days badge is worked out from recorded attendance and is not stored per visitor. It therefore also covers visitors who attended before the badge was created.
- The check-in result tells a visitor when that check-in completes the all-days badge.
- Every badge has an Arabic and English name and challenge description, plus an on/off switch.
- A switched-off badge cannot be earned and is hidden from visitors who have not earned it. Visitors keep badges they already earned.
- The one scan button handles badge codes. The QR holds the existing `/scan/<token>` link, and the scan page routes the token by what it belongs to.

### Appearance

Each badge has an icon from a fixed list in config. An uploaded image replaces the icon, and removing the image brings the icon back.

The browser shrinks the picture to at most 512 by 512 pixels before upload, so any phone photo works. The server accepts only PNG, JPEG, and WebP, identified from the file's first bytes, up to 400 KB.

Images live in PostgreSQL in their own table, because the three web replicas share no disk. They are served from a public route with a version in the address and a long browser cache.

### Coins page

A new section lists the visitor's badges under the coin total. Earned badges appear in color and first, and unearned ones are faded with their challenge description. The all-days row shows progress, such as 1 of 3 days.

## Delete protection

| Deleting | Refused when | The warning names |
|---|---|---|
| Place | Agenda items or attendance codes use it | Each item's title, day, and time, and each code's date |
| Attendance code | Attendance exists on its date | The date and the number of visitors |
| Coin code | A visitor collected it | The number of visitors |
| Badge | A visitor earned it | The number of visitors |
| Agenda item | Never: nothing depends on it | Normal two-press confirmation |

The API answers `409` with the code `IN_USE` and a `links` list. Foreign keys from agenda items and attendance codes to places become `RESTRICT`, so a link created at the same moment cannot be orphaned; that failure produces the same warning.

## Attendance codes and places

A new code must have a place. Codes made before this change have none and can be given one through a new edit action, which changes only the place. The place appears on the admin row and on the printed sheet.

## Agenda admin

One collapsible section per event day, showing the date and item count, with items sorted by start time. Today's section starts open during the event, and the first day otherwise. Adding from inside a section presets that day, and editing an item can still move it to another day.

## Removing staff

Removed: the check-in page and API, the check-in desk component, and their text and styles.

The migration turns any staff account into a visitor, removes `staff` from the role type, and drops `check_ins.checked_in_by`. Attendance already recorded stays.

Cost accepted by the owner: if a visitor's phone or the door code fails, nobody can record that visitor's attendance. The personal QR is for display only.

## Not-found page

An inline SVG scene: a Formula car follows the track, loses the bend, skids into the gravel, and stops in a dust cloud, then the scene replays after a pause. It needs no JavaScript. With reduced motion on, the car sits still off the track. Below it are "404", "خرجت عن المسار", and a button home. All not-found addresses show it, including ones with no language in them, using the saved language.

## Testing

Integration tests cover earning, repeats, simultaneous scans, the all-days rule, switched-off badges, image validation, every delete rule, and the migration's staff conversion. End-to-end tests on a phone viewport cover creating and earning a badge, the delete warning, the agenda sections, and the not-found page.
