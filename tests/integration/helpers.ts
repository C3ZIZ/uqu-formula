// Shared setup for integration tests: migrates once and empties tables between tests.
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { runMigrations } from "@/db/migrate";
import { registerUser } from "@/services/users";

/** Prepares an empty, up-to-date database. */
export async function resetDatabase(): Promise<void> {
  await runMigrations();
  await db.execute(
    sql`TRUNCATE users, password_resets, check_ins, zones, agenda_items, coin_codes, coin_claims, attendance_codes, badges, badge_images, badge_claims CASCADE`,
  );
}

/** Creates a visitor with a unique email for a test. */
export async function makeUser(email = `v${crypto.randomUUID()}@example.com`, password = "password-123") {
  const result = await registerUser({ name: "Test Visitor", email, phone: "0501234567", password });
  if (!result.ok) throw new Error(`could not create user: ${result.code}`);
  return result.user;
}
