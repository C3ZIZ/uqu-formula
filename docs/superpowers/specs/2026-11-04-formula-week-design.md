# Formula Week website: design

## Purpose

Formula Week is a three-day Umm Al-Qura University event that joins engineering and motorsport. Visitors use this site on their phones to register, follow the agenda, find places on a map, show a badge, and collect coins. Organizers use it to see who registered, record who attended, and manage content.

Success means:

- All five features in the client brief work well on a phone, in Arabic and in English.
- A k6 load test shows the system serving 1000 concurrent users on one Docker host.
- A visitor can never earn the same code's coins twice.

## Decisions

| Topic | Decision |
|---|---|
| Application | One Next.js 16 app in TypeScript. Route handlers serve the API. No separate backend. |
| Database | PostgreSQL 17 with Drizzle ORM and plain SQL migrations. |
| Web server | Caddy load-balances three Next.js replicas and terminates HTTPS. |
| Sign-in | Email and password, with password reset by email. |
| Content editing | Admins edit the agenda, map zones, and coin codes in an admin panel. |
| Coin rule | Admins create each code and set its coins. Each visitor can claim a code once. |
| Attendance | Staff scan badges. One check-in per visitor per calendar day in Riyadh time. |
| Redis | Left out. Replicas cache content in memory for 30 seconds. |

Out of scope: leaderboard, prize redemption, native apps, offline mode.

## Roles

- **Visitor:** badge, agenda, map, coins.
- **Staff:** visitor features and the check-in scanner.
- **Admin:** staff features plus registrants, CSV export, agenda, zones, coin codes, and role changes.

The first admin comes from environment variables at seed time.

## Architecture

```
phone -> Caddy (HTTPS) -> web x 3 (Next.js) -> PostgreSQL
                                            -> SMTP (Mailpit locally)
```

A one-shot `migrate` container applies migrations and seeds before the web replicas start.

### Source layout

```
src/config/       routes, literals, limits, theme values, event data, ar and en messages
src/db/           schema, connection pool, migrations, seed
src/lib/          small helpers: passwords, sessions, validation, CSV, QR, cache, API replies
src/services/     business rules: users, coins, check-ins, agenda, zones
src/components/   shared UI
src/app/[locale]/ pages for each language
src/app/api/      JSON API
tests/            unit, integration, and end-to-end tests
loadtest/         k6 script
```

### Project conventions

- Each file starts with a one-line comment that says what it holds. Each function has a short comment.
- User-visible text lives only in `src/config/messages`. Routes live only in `src/config/routes.ts`. Limits and other literals live in `src/config`.
- Automated checks enforce all three rules, so a violation fails the test suite.

## Data

| Table | Purpose | Rule |
|---|---|---|
| `users` | Name, email, phone, role, password hash, failed-login count, lock time, badge code | Email and badge code are unique |
| `password_resets` | Hash of a reset token, expiry, used time | A token works once and expires after one hour |
| `check_ins` | Visitor, Riyadh calendar date, staff member, time | Unique on visitor and date |
| `zones` | Arabic and English name and details, type, position and size on the map | |
| `agenda_items` | Arabic and English title and details, day number, start and end time, zone | |
| `coin_codes` | Random token, Arabic and English label, coins, active flag | Token is unique |
| `coin_claims` | Visitor, code, coins earned, time | Primary key on visitor and code |

## Key flows

### Coin claim

1. A printed QR holds a link to `/scan/{token}`, so the phone camera or the in-site scanner can open it. That link forwards to the visitor's language.
2. Opening the link changes nothing, so link previews cannot claim coins. The page sends a POST from the browser.
3. A logged-out visitor goes to login and returns to the same link.
4. The service inserts the claim with `ON CONFLICT DO NOTHING`. The database alone decides, so simultaneous scans count once.
5. The visitor sees the coins earned, "already collected", or "not valid". An inactive or unknown code earns nothing.

A claim stores the coin amount at claim time, so later edits to a code leave earned coins unchanged.

### Check-in

Staff scan a badge QR that holds the random badge code. The service inserts one row per visitor per Riyadh date. A repeat scan reports the earlier time instead of failing. The badge code reveals no personal data.

### Accounts

- Passwords use scrypt from Node's standard library at OWASP-recommended cost.
- Sessions are signed HTTP-only cookies with `SameSite=Lax`. Reading a session needs no database query.
- Admin and staff requests re-read the role from the database, so removing a role takes effect immediately.
- Five failed logins lock an account for five minutes. Per-IP limits are left out because campus Wi-Fi puts many people behind one address.
- Login and reset replies do not reveal whether an email is registered.
- POST requests must have an Origin that matches the host.

## Scaling to 1000 concurrent users

- Agenda and zone data sit in a 30-second per-replica cache with single-flight loading, so a rush of readers causes one query per replica.
- Each replica keeps at most 20 database connections, 60 in total, under the PostgreSQL limit of 100.
- Next.js standalone output and Caddy compression keep responses small and fast. Static assets carry long cache lifetimes.
- k6 drives a realistic mix of browsing, sign-in, and coin claims with 1000 virtual users. The pass mark is 95% of requests under 800 ms and under 1% failures. Password hashing is the expected bottleneck, so the script includes logins.

## Interface

### Identity

From the supplied Canva identity:

- Colors: `#0c272c`, `#2a636d`, `#358b9a`, `#9f895c`, black, and white. The icon burgundy is outside the approved palette, so it stays out.
- Fonts: IBM Plex Sans Arabic for text, Noto Kufi Arabic standing in for Droid Arabic Kufi in Arabic headings, and Michroma standing in for the wide English logotype font. TS Safaa and 29LT Bukra need client licenses.
- Motifs: the slanted parallelogram slashes, the checkered wave, and the small pixel check marks.

The Canva file disables export, so the logo in this build is a redrawn temporary version. The client must supply the final SVG. The car renders show real sponsor logos, so they stay off the site.

### Direction

The site should feel like a race paddock and not a template.

- Real CC0 textures: track asphalt for dark surfaces and woven carbon for the badge backing. Textures come from Poly Haven and ambientCG, and each one is listed with its source and license in the repository.
- Full-bleed bands of color with slanted edges replace cards. Lists use spacing and hairlines. Nothing has a colored stripe on one edge, and rounded bordered boxes are avoided.
- Large type and time values lead the agenda, in the manner of a timing screen.
- A fixed bottom bar holds the main sections, within thumb reach. Tap targets are at least 44 pixels.
- Motion is short and functional: a slide between days, a sheet rising on the map, a brief count-up when coins arrive. Reduced-motion settings are honored.
- Layouts use logical CSS properties, so Arabic and English mirror correctly.

### Screens

- **Home:** identity, what the event is, the next step for this visitor.
- **Register, login, forgot password, reset password.**
- **Agenda:** day tabs and timed entries that link to their map zone.
- **Map:** tappable zones that open a bottom sheet with details and the zone's agenda.
- **Badge:** name, QR, and code on a carbon backing, sized to show at arm's length.
- **Coins:** total, scanner button, claim history.
- **Scan result:** coins earned, already collected, or not valid.
- **Staff check-in:** continuous scanner with immediate results.
- **Admin:** dashboard counts, registrants with search and CSV, agenda, zones with click-to-place, coin codes with printable QR.

## Error handling

The API returns a stable error code, and the interface turns that code into translated text. Validation errors name the field. Scanners explain denied camera access and offer manual code entry. CSV export neutralizes spreadsheet formulas and includes a byte-order mark so Excel displays Arabic correctly.

## Testing

- Unit tests cover passwords, sessions, validation, CSV, and message completeness across languages.
- Integration tests run services against real PostgreSQL. They include concurrent coin claims and account lockout.
- Playwright runs the main flows at phone size against the Docker stack, in both languages.
- k6 checks the 1000-user target.

## Content the client must supply

Event dates and venue, final agenda, venue floor plan, booth and zone list, coin values, logo files, font licenses, and an SMTP account. The seed data is clearly marked sample content until then. The source uses two spellings, "الفورميلا" and "الفورمولا". The site uses the cover's spelling from one config value until the client confirms.
