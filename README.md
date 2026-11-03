# Formula Week

The event website for Formula Week at Umm Al-Qura University. It is Arabic-first with English support and built for phones.

Visitors register, follow the agenda, find places on a map, show a QR badge, collect coins, and scan a daily code at the entrance to record attendance. Staff can also scan badges. Admins manage content, coin and attendance codes, roles, and the registrant list.

## Stack

| Part | Choice |
|---|---|
| Application | Next.js 16 and TypeScript, with pages and API in one app |
| Database | PostgreSQL 17 with Drizzle ORM |
| Load balancing | Caddy in front of three web replicas |
| Tests | Vitest, Playwright, and k6 |

## Run locally

You need Docker. This project uses OrbStack.

```sh
cp .env.example .env   # then replace every value
docker compose up -d --build --wait
```

- Site: <https://localhost> (the browser warns about the local certificate)
- Caught emails: <http://localhost:8025>

Migrations and the seed run automatically. The seed creates the admin from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, and adds sample content only to an empty database.

## Test

```sh
docker compose -f docker-compose.test.yml up -d --wait   # database for integration tests
npm test                                                 # unit and integration
npm run test:e2e                                         # phone-size browser tests against the running stack
npm run lint && npm run typecheck
```

## Project rules

- All visitor text lives in `src/config/messages`. All routes live in `src/config/routes.ts`. Limits and other literals live in `src/config`.
- Every file starts with a one-line comment, and every function has a short comment.
- Tests and lint fail when these rules break.
- Git work follows `git-guide.md`.

## Where things live

```
src/config/       routes, literals, limits, event data, ar and en messages
src/db/           schema, migrations, seed, sample content
src/lib/          helpers: passwords, sessions, validation, CSV, QR, cache
src/services/     business rules: users, coins, check-ins, agenda, zones
src/components/   shared interface parts
src/app/[locale]/ pages for each language
src/app/api/      JSON API
src/styles/       design tokens and styles
public/textures/  real CC0 textures, with sources in LICENSES.md
```

## Deploy on Coolify

Coolify builds `docker-compose.coolify.yml` from this repository through its GitHub App, and routes the domain to the `proxy` service.

Set these environment variables in Coolify. Never commit them.

| Variable | Purpose |
|---|---|
| `POSTGRES_PASSWORD` | Database password, generated once |
| `SESSION_SECRET` | Signs login cookies, at least 32 characters |
| `APP_URL` | Public address, used in printed QR codes and reset emails |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | First admin. The seed never changes an existing account |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | Password reset email |

Changing `APP_URL` after printing means reprinting the coin codes, because each QR holds the full address.

## Regenerate the preview image

With the local stack running:

```sh
npx tsx scripts/generate-og.ts
```
