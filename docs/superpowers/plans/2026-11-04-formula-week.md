# Formula Week Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The author implements this plan in the same session, so tasks fix interfaces and required tests and leave code to the source files.

**Goal:** Build the dockerized, Arabic-first Formula Week website with registration, attendance, agenda, map, badge, coins, and admin panel, proven at 1000 concurrent users.

**Architecture:** One Next.js 16 app serves pages and a JSON API. Caddy balances three replicas. PostgreSQL holds all data and enforces the one-claim rule.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, plain CSS tokens, PostgreSQL 17, Drizzle ORM, jose, zod, qrcode, jsqr, nodemailer, Caddy, Vitest, Playwright, k6.

**Spec:** `docs/superpowers/specs/2026-11-04-formula-week-design.md`

## Global Constraints

- Each file starts with a one-line comment. Each named function has a short comment.
- User-visible text lives in `src/config/messages`; routes live in `src/config/routes.ts`; literals live in `src/config`.
- Colors: `#0c272c`, `#2a636d`, `#358b9a`, `#9f895c`, black, white. No burgundy, no cards, no stripe borders.
- Tap targets are at least 44 pixels. Layouts use logical CSS properties.
- Commits follow `git-guide.md`: no Claude credit, no pushes to `main` or `dev`, no PR until asked.

## Review Focus

- A logged-out visitor scans a code: after login they return to the same code and the coins arrive. Pinned in Task 9.
- A double tap or two devices claim at once: coins count once. Pinned in Task 4.
- Arabic keyboards and casing: `٠٥٠...` phones and `Name@X.com` emails normalize, so duplicates are caught. Pinned in Tasks 3 and 4.
- The login `next` value points off-site: login stays on this site. Pinned in Task 3.
- An admin removes their own role or deletes a code with claims: the last admin stays, and earned coins stay. Pinned in Task 4.

---

### Task 1: Project foundation

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `src/config/*`, `tests/unit/conventions.test.ts`, `tests/unit/messages.test.ts`

**Produces:** `PAGE_ROUTES`, `API_ROUTES`, `localePath(locale, path)`, `getMessages(locale)`, `LIMITS`, `ROLES`, `ERROR_CODES`, `EVENT`.

- [ ] Conventions test fails on any file without a header comment, on Arabic text outside config and seed, and on route strings outside the routes file.
- [ ] Messages test fails when Arabic and English keys differ or a value is empty.
- [ ] Commit.

### Task 2: Database

**Files:** `src/db/schema.ts`, `src/db/client.ts`, `src/db/migrate.ts`, `src/db/seed.ts`, `src/db/sample-content.ts`, `drizzle.config.ts`, `docker-compose.test.yml`

**Produces:** Drizzle tables `users`, `passwordResets`, `checkIns`, `zones`, `agendaItems`, `coinCodes`, `coinClaims`; singleton `db`.

- [ ] Generate the migration and apply it to the test database.
- [ ] Seed twice and confirm the second run adds nothing.
- [ ] Commit with Task 3.

### Task 3: Helpers

**Files:** `src/lib/{env,password,session,auth,validation,api,csv,qr,qr-payload,codes,ttl-cache,mail,dates,safe-redirect}.ts`

**Produces:** `hashPassword`, `verifyPassword`, `signSession`, `readSession`, `toCsv`, `qrSvg`, `parseCoinPayload`, `generateCode`, `createTtlCache`, `riyadhDate`, `safeNextPath`, zod schemas, `jsonOk`, `jsonError`, `guardedBody`.

Required tests:

- [ ] Password round trip, wrong password rejected, malformed hash rejected.
- [ ] Tampered and expired sessions rejected.
- [ ] Validation converts Arabic digits in phones and lowercases emails.
- [ ] CSV escapes quotes and neutralizes `=`, `+`, `-`, `@`, and starts with a byte-order mark.
- [ ] TTL cache makes one load for concurrent readers and reloads after expiry or failure.
- [ ] `riyadhDate` rolls over at Riyadh midnight and not at UTC midnight.
- [ ] `safeNextPath` rejects `https://evil.com`, `//evil.com`, and `/\evil.com`.
- [ ] `parseCoinPayload` accepts a bare token, lowercase token, and full link, and rejects other text.
- [ ] Commit.

### Task 4: Services

**Files:** `src/services/{users,coins,checkins,agenda,zones}.ts`, `tests/integration/*`

**Consumes:** Tasks 2 and 3.

**Produces:** `registerUser`, `authenticate`, `requestPasswordReset`, `resetPassword`, `listRegistrants`, `setUserRole`, `claimCode`, `getCoinSummary`, `listCoinCodes`, `createCoinCode`, `updateCoinCode`, `deleteCoinCode`, `checkInByBadge`, `getAttendanceCounts`, agenda and zone list and write functions.

Required integration tests against real PostgreSQL:

- [ ] Twenty simultaneous claims of one code by one visitor insert one row. Two visitors each earn the coins.
- [ ] Inactive and unknown codes earn nothing. Editing a code leaves earned coins unchanged.
- [ ] Deleting a code with claims is refused.
- [ ] Duplicate email differing only in case is refused.
- [ ] Five failed logins lock the account even for the right password. The lock expires. Success clears the count.
- [ ] Reset tokens work once and expire.
- [ ] Check-in twice on one Riyadh date reports the first time. A new date records again. Unknown badge reports unknown.
- [ ] Removing the last admin's role is refused.
- [ ] Commit.

### Task 5: API

**Files:** `src/app/api/**`, `src/app/route.ts`, `src/app/scan/[token]/route.ts`

**Produces:** All endpoints in `API_ROUTES`. Errors use `{ error: code, fields? }`.

- [ ] Verified end to end by Task 9. Commit.

### Task 6: Visual system and assets

**Files:** `public/textures/*`, `public/textures/LICENSES.md`, `src/styles/*`, `src/components/{Logo,Slashes,TopBar,BottomNav,LocaleSwitch,Field,Button}.tsx`, `src/app/[locale]/layout.tsx`

- [ ] Download and inspect real CC0 textures. Confirm each license at its source.
- [ ] Compress to WebP and record source and license.
- [ ] Check text contrast of each token pair against WCAG AA.
- [ ] Commit.

### Task 7: Visitor screens

**Files:** `src/app/[locale]/{page,login,register,forgot-password,reset-password,agenda,map,badge,coins,scan}/**`, `src/components/{AgendaDays,VenueMap,QrScanner,CoinScanner,ClaimResult,AuthForm}.tsx`

- [ ] Each screen renders at 390 pixels wide, in both languages, without horizontal scrolling. Inspect screenshots.
- [ ] Commit.

### Task 8: Staff and admin screens

**Files:** `src/app/[locale]/staff/**`, `src/app/[locale]/admin/**`, `src/components/admin/*`

- [ ] Staff scanner records attendance. Admin edits agenda, zones, and coin codes. CSV opens with correct Arabic.
- [ ] Commit.

### Task 9: Docker and end-to-end tests

**Files:** `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.env.example`, `playwright.config.ts`, `tests/e2e/*`, `README.md`

Required Playwright tests at phone size:

- [ ] Register, see the badge, open the map zone sheet, change language.
- [ ] Logged-out visit to a coin link: log in, return, earn coins. A second visit says already collected.
- [ ] Admin creates a coin code, and a visitor claims it.
- [ ] Staff checks in a visitor by manual code, and the admin count rises.
- [ ] Commit.

### Task 10: Load test and finish

**Files:** `loadtest/k6.js`, `loadtest/seed.ts`, `README.md`

- [ ] Run 1000 virtual users. Pass mark: 95% of requests under 800 ms and under 1% failures. Fix what the test reveals, and record results in the README.
- [ ] Run lint, type check, unit, integration, and end-to-end tests. Review the whole branch independently.
- [ ] Draft the client reply. Push the feature branch.
