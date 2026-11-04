// Database tables. The primary keys on check-ins and claims enforce the one-time rules.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { BADGE_KINDS, ROLE_LIST, ZONE_TYPES } from "@/config/literals";

export const roleEnum = pgEnum("role", ROLE_LIST);
export const zoneTypeEnum = pgEnum("zone_type", ZONE_TYPES);
export const badgeKindEnum = pgEnum("badge_kind", BADGE_KINDS);

const bytea = customType<{ data: Buffer }>({
  /** Names the PostgreSQL column type for binary data. */
  dataType() {
    return "bytea";
  },
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("visitor"),
  badgeCode: text("badge_code").notNull().unique(),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResets = pgTable("password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const checkIns = pgTable(
  "check_ins",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    eventDate: date("event_date").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.eventDate] }), index("check_ins_date_idx").on(table.eventDate)],
);

export const zones = pgTable("zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  detailsAr: text("details_ar").notNull().default(""),
  detailsEn: text("details_en").notNull().default(""),
  type: zoneTypeEnum("type").notNull(),
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
});

export const agendaItems = pgTable(
  "agenda_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titleAr: text("title_ar").notNull(),
    titleEn: text("title_en").notNull(),
    detailsAr: text("details_ar").notNull().default(""),
    detailsEn: text("details_en").notNull().default(""),
    day: integer("day").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    zoneId: uuid("zone_id").references(() => zones.id, { onDelete: "restrict" }),
  },
  (table) => [index("agenda_day_time_idx").on(table.day, table.startTime)],
);

export const coinCodes = pgTable(
  "coin_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    labelAr: text("label_ar").notNull(),
    labelEn: text("label_en").notNull(),
    coins: integer("coins").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("coin_codes_coins_positive", sql`${table.coins} > 0`)],
);

export const coinClaims = pgTable(
  "coin_claims",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeId: uuid("code_id")
      .notNull()
      .references(() => coinCodes.id, { onDelete: "restrict" }),
    coins: integer("coins").notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.codeId] })],
);

// One door code per event date. Scans are recorded in check_ins.
export const attendanceCodes = pgTable("attendance_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  eventDate: date("event_date").notNull().unique(),
  zoneId: uuid("zone_id").references(() => zones.id, { onDelete: "restrict" }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Challenge badges carry a code. The one all-days badge has none, because attendance decides who earned it.
export const badges = pgTable(
  "badges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: badgeKindEnum("kind").notNull(),
    token: text("token").unique(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    challengeAr: text("challenge_ar").notNull().default(""),
    challengeEn: text("challenge_en").notNull().default(""),
    icon: text("icon").notNull(),
    imageUpdatedAt: timestamp("image_updated_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("badges_one_all_days").on(table.kind).where(sql`${table.kind} = 'all_days'`),
    check("badges_token_matches_kind", sql`(${table.kind} = 'challenge') = (${table.token} IS NOT NULL)`),
  ],
);

// Images sit in their own table, so listing badges never loads them.
export const badgeImages = pgTable("badge_images", {
  badgeId: uuid("badge_id")
    .primaryKey()
    .references(() => badges.id, { onDelete: "cascade" }),
  data: bytea("data").notNull(),
  contentType: text("content_type").notNull(),
});

export const badgeClaims = pgTable(
  "badge_claims",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "restrict" }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.badgeId] })],
);
