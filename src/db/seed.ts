// Creates the first admin and, only when asked, sample content on an empty database. Safe to run repeatedly.
import { fileURLToPath } from "node:url";
import { count } from "drizzle-orm";
import { CODE_KINDS, ROLES } from "@/config/literals";
import { generateCode } from "@/lib/codes";
import { hashPassword } from "@/lib/password";
import { db, pool } from "./client";
import { SAMPLE_AGENDA, SAMPLE_COIN_CODES, SAMPLE_ZONES } from "./sample-content";
import { agendaItems, coinCodes, users, zones } from "./schema";

/** Creates the first admin account if that email is not registered yet. */
async function seedAdmin(email: string, password: string): Promise<void> {
  await db
    .insert(users)
    .values({
      name: "Admin",
      email: email.trim().toLowerCase(),
      phone: "0000000000",
      passwordHash: await hashPassword(password),
      role: ROLES.admin,
      badgeCode: generateCode(CODE_KINDS.visitor),
    })
    .onConflictDoNothing({ target: users.email });
}

/** Adds sample zones and agenda only when no zones exist, so admin edits are never overwritten. */
async function seedContent(): Promise<void> {
  const [existing] = await db.select({ value: count() }).from(zones);
  if (existing.value > 0) return;
  const created = await db
    .insert(zones)
    .values(SAMPLE_ZONES.map(({ key, ...zone }) => zone))
    .returning({ id: zones.id, nameEn: zones.nameEn });
  const idByKey = new Map(
    SAMPLE_ZONES.map((sample) => [sample.key, created.find((zone) => zone.nameEn === sample.nameEn)?.id]),
  );
  await db.insert(agendaItems).values(
    SAMPLE_AGENDA.map(({ zone, ...item }) => ({ ...item, zoneId: idByKey.get(zone) ?? null })),
  );
}

/** Adds sample coin codes only when no codes exist. */
async function seedCoinCodes(): Promise<void> {
  const [existing] = await db.select({ value: count() }).from(coinCodes);
  if (existing.value > 0) return;
  await db.insert(coinCodes).values(SAMPLE_COIN_CODES.map((code) => ({ ...code, token: generateCode(CODE_KINDS.coin) })));
}

interface SeedOptions {
  adminEmail: string;
  adminPassword: string;
  sampleContent?: boolean;
}

/** Runs the seed steps. Sample content is opt-in, so a real site that starts empty stays empty. */
export async function runSeed({ adminEmail, adminPassword, sampleContent = false }: SeedOptions) {
  await seedAdmin(adminEmail, adminPassword);
  if (!sampleContent) return;
  await seedContent();
  await seedCoinCodes();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.");
  await runSeed({ adminEmail, adminPassword, sampleContent: process.env.SEED_SAMPLE_CONTENT === "true" });
  await pool.end();
  console.log("Seed complete.");
}
