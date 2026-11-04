# Challenge Badges and Safer Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The owner chose inline execution and authorized merging and deploying.

**Goal:** Add challenge badges, delete protection, agenda day sections, and an animated not-found page, and remove the staff scanner.

**Architecture:** Same Next.js app. New `badges`, `badge_images`, and `badge_claims` tables with a `src/services/badges.ts` service. Delete rules return a shared `links` list that one admin component renders.

**Tech Stack:** Next.js 16, Drizzle, PostgreSQL 17, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-04-challenge-badges-design.md`

## Global Constraints

- Every file has a one-line comment, every function a short comment.
- All visitor text in `src/config/messages/{ar,en}.ts`, routes in `src/config/routes.ts`, limits in `src/config/limits.ts`, fixed values in `src/config/literals.ts`.
- No cards or stripe borders. Logical CSS only, RTL first, touch targets at least 48 px.
- The electronic badge page does not change.
- Commit format follows `git-guide.md`: summary, then **Features:** / **Fixes:**, no credit lines.
- Migrations come from `npm run db:generate`, with data steps added to the generated SQL.

## Review Focus

- A place with both agenda items and attendance codes: the warning lists both.
- A visitor who scans a switched-off badge: told it is invalid, and nothing is recorded.
- A non-image or oversized upload sent straight to the API: rejected by file content, not by its claimed type.
- A visitor who attended all days before the all-days badge existed: sees it as earned.
- A place deleted while an admin's stale form links to it: a readable error, not a server error.

---

### Task 1: Remove the staff scanner and role

**Files:**
- Delete: `src/app/[locale]/staff/`, `src/app/api/staff/`, `src/components/CheckInDesk.tsx`
- Modify: `src/config/literals.ts`, `src/config/routes.ts`, `src/config/messages/{ar,en}.ts`, `src/db/schema.ts`, `src/lib/auth.ts`, `src/lib/validation.ts`, `src/services/checkins.ts`, `src/app/[locale]/page.tsx`, attendance print page, `src/styles/screens.css`, `tests/`

**Interfaces:**
- Produces: `ROLES = { visitor, admin }`; `text.admin.attendanceCodes.printTitle`; `check_ins` without `checked_in_by`.

- [ ] Write a failing integration test: a `staff` account inserted before migration 0003 becomes `visitor` (run the migration SQL path through `runMigrations` on a scratch schema, or assert through the migration file's data statement), and `ROLE_LIST` has no staff.
- [ ] Run it and watch it fail.
- [ ] Remove the code, text, and styles; generate migration 0003; prepend `UPDATE users SET role='visitor' WHERE role='staff'`.
- [ ] Replace staff check-in e2e tests with an admin promotion test against the admin panel; fix the "اسأل المنظمين" wording.
- [ ] Run `npm test`, lint, typecheck. Commit.

### Task 2: Delete protection and places on attendance codes

**Files:**
- Create: `src/lib/delete-links.ts`, `src/components/admin/DeleteBlocked.tsx`, `tests/integration/delete-rules.test.ts`
- Modify: `src/db/schema.ts`, `src/lib/crud-route.ts`, `src/lib/api.ts`, `src/lib/client-api.ts`, `src/lib/validation.ts`, `src/services/{zones,attendance-codes,coins}.ts`, `src/components/admin/{ResourceManager,AttendanceCodesManager}.tsx`, attendance admin and print pages, messages, `src/config/literals.ts`

**Interfaces:**
- Produces: `ERROR_CODES.inUse = "IN_USE"` (replaces `codeHasClaims`); `type DeleteLink = { type: "agenda_item"; nameAr; nameEn; day; startTime } | { type: "attendance_code"; date } | { type: "check_ins"; date; count } | { type: "coin_claims"; count } | { type: "badge_claims"; count }`; `DeleteOutcome = { ok: true } | { ok: false; code: ErrorCode; links?: DeleteLink[] }`; `isForeignKeyViolation(error)`; `jsonError(code, fields?, links?)`; `sendJson` failure result gains `links`; `ResourceManager` prop `editFields`.

- [ ] Write failing tests for every row of the spec's delete table, including a place with both link types, `RESTRICT` at database level, and a code with a stale `zoneId` returning a validation result.
- [ ] Watch them fail.
- [ ] Change schema, generate migration 0004 (`agenda_items.zone_id` to `RESTRICT`, new nullable `attendance_codes.zone_id` with `RESTRICT`).
- [ ] Implement services, route, and `DeleteBlocked`; add the place select, edit-place action, and the place on the row and print sheet.
- [ ] Add an e2e test: deleting a place with an agenda item shows the item's title and leaves the place.
- [ ] Run the suite. Commit.

### Task 3: Agenda sections per day

**Files:**
- Modify: `src/components/admin/AgendaManager.tsx`, `src/app/[locale]/admin/agenda/page.tsx`, `src/styles/screens.css`, messages, `tests/e2e/admin.spec.ts`

**Interfaces:**
- Consumes: `ResourceManager`.
- Produces: `agendaOpenDay(today: string): number` in `src/lib/dates.ts`.

- [ ] Write failing unit tests for `agendaOpenDay` (event date opens that day; any other date opens day 1) and an e2e test: items added out of order appear by time within their day's section, and sections collapse.
- [ ] Watch them fail.
- [ ] Implement one `ResourceManager` per day inside a disclosure button with `aria-expanded`, keeping state across refreshes.
- [ ] Run the suite. Commit.

### Task 4: Badge data, rules, and API

**Files:**
- Create: `src/services/badges.ts`, `src/lib/badge-image.ts`, `src/app/api/badges/claim/route.ts`, `src/app/api/badges/[id]/image/route.ts`, `src/app/api/admin/badges/route.ts`, `src/app/api/admin/badges/[id]/route.ts`, `src/app/api/admin/badges/[id]/qr/route.ts`, `tests/integration/badges.test.ts`, `tests/unit/badge-image.test.ts`
- Modify: `src/db/schema.ts`, `src/config/{literals,limits,routes}.ts`, `src/lib/validation.ts`, `src/services/attendance-codes.ts`, `tests/integration/helpers.ts`

**Interfaces:**
- Produces: `BADGE_KINDS`, `BADGE_ICONS`; `claimBadge(userId, rawToken) -> { status, name? }`; `isBadgeToken(rawToken)`; `getVisitorBadges(userId) -> rows with earned, earnedAt, progress`; `listBadges()`, `getBadge(id)`, `createBadge(input)`, `updateBadge(id, input)`, `setBadgeActive`, `deleteBadge(id): DeleteOutcome`; `readBadgeImage(id)`; `parseBadgeImage(base64) -> { data, contentType } | null`; `checkInWithCode` result gains `allDaysBadge?: { nameAr, nameEn }`.

- [ ] Write failing tests: earning, repeat, simultaneous scans, switched-off, all-days rule with backfill, one all-days badge only, image magic bytes and size, delete refusal, image removal returning to the icon.
- [ ] Watch them fail.
- [ ] Generate migration 0005; implement service, image parser, and routes.
- [ ] Run the suite. Commit.

### Task 5: Badge admin screens

**Files:**
- Create: `src/components/admin/BadgesManager.tsx`, `src/components/admin/BadgeImagePicker.tsx`, `src/components/BadgeMedal.tsx`, `src/app/[locale]/admin/badges/page.tsx`, `src/app/[locale]/admin/badges/[id]/print/page.tsx`, `src/lib/shrink-image.ts`
- Modify: `src/components/admin/AdminTabs.tsx`, messages, `src/styles/screens.css`

**Interfaces:**
- Consumes: Task 4 routes and `ResourceManager`.
- Produces: `BadgeMedal({ icon, imageUrl, earned, size })`.

- [ ] Write a failing e2e test: an admin creates a challenge badge with an icon, then with an uploaded PNG, prints it, and switches it off.
- [ ] Watch it fail.
- [ ] Implement.
- [ ] Run the suite. Commit.

### Task 6: Visitor badges

**Files:**
- Create: `src/components/BadgeResult.tsx`, `tests/e2e/badges.spec.ts`
- Modify: `src/app/[locale]/coins/page.tsx`, `src/app/[locale]/scan/[token]/page.tsx`, `src/components/AttendanceResult.tsx`, messages, `src/styles/screens.css`

**Interfaces:**
- Consumes: `claimBadge`, `getVisitorBadges`, `BadgeMedal`, `allDaysBadge`.

- [ ] Write failing e2e tests: the visitor sees the badge faded with its challenge, types its code in the scanner, gets the alert, sees it in color, and a second scan says they already have it.
- [ ] Watch them fail.
- [ ] Implement, and show the all-days badge on the check-in result.
- [ ] Run the suite. Commit.

### Task 7: Animated not-found page

**Files:**
- Create: `src/components/OffTrackScene.tsx`, `src/components/NotFoundText.tsx`, `tests/e2e/not-found.spec.ts`
- Modify: `src/app/[locale]/not-found.tsx`, `src/app/[locale]/layout.tsx`, messages, `src/styles/screens.css`

**Interfaces:**
- Produces: `layoutLocale(value)` in `src/lib/page.ts`, which falls back to Arabic so the layout can render the not-found page for addresses with no language.

- [ ] Write failing e2e tests: `/xyz` and `/ar/xyz` show "خرجت عن المسار" with status 404, `/en/xyz` shows the English title, and a reduced-motion context shows the still car.
- [ ] Watch them fail.
- [ ] Implement the SVG scene with SMIL animation and a static reduced-motion copy.
- [ ] Check it with phone screenshots mid-animation and at rest. Commit.

### Task 8: Docs and final checks

**Files:**
- Modify: `README.md`

- [ ] Update the README's overview and project notes.
- [ ] Run unit, integration, e2e, lint, and typecheck against a rebuilt stack.
- [ ] Commit, then run the final whole-branch review.

### Task 9: Readable codes

Runs before Task 4, which needs the generator.

**Files:**
- Modify: `src/config/literals.ts`, `src/config/limits.ts`, `src/lib/codes.ts`, `src/lib/qr-payload.ts`, `src/services/{users,coins,attendance-codes}.ts`, `src/db/seed.ts`, `tests/`
- Create: migration replacing all stored codes

**Interfaces:**
- Produces: `CODE_KINDS`, `generateCode(kind): string`, `normalizeCode` returning the dashed form.

- [ ] Write failing tests for the format, typed-code matching, the migration, and the registration retry.
- [ ] Watch them fail.
- [ ] Implement, and generate the data migration.
- [ ] Run the suite. Commit.
