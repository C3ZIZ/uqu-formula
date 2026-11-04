// Tests data-changing migrations against a scratch database that starts at the older schema.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";
import { ROLE_LIST } from "@/config/literals";
import { MIGRATIONS_FOLDER } from "@/db/migrate";

const SCRATCH_DB = "formula_migration_test";
const adminUrl = process.env.DATABASE_URL ?? "";
const journal = JSON.parse(readFileSync(join(MIGRATIONS_FOLDER, "meta/_journal.json"), "utf8")) as {
  entries: { idx: number; tag: string }[];
};

/** Runs every statement of one migration file. */
async function applyMigration(client: Client, idx: number): Promise<void> {
  const entry = journal.entries.find((item) => item.idx === idx);
  if (!entry) throw new Error(`migration ${idx} does not exist`);
  const statements = readFileSync(join(MIGRATIONS_FOLDER, `${entry.tag}.sql`), "utf8").split("--> statement-breakpoint");
  for (const statement of statements) await client.query(statement);
}

/** Runs a query against the shared test server, outside the scratch database. */
async function onServer(query: string): Promise<void> {
  const server = new Client({ connectionString: adminUrl });
  await server.connect();
  await server.query(query);
  await server.end();
}

describe("removing the staff role", () => {
  let scratch: Client;

  beforeAll(async () => {
    await onServer(`DROP DATABASE IF EXISTS ${SCRATCH_DB}`);
    await onServer(`CREATE DATABASE ${SCRATCH_DB}`);
    const url = new URL(adminUrl);
    url.pathname = `/${SCRATCH_DB}`;
    scratch = new Client({ connectionString: url.toString() });
    await scratch.connect();
    for (const idx of [0, 1, 2]) await applyMigration(scratch, idx);
  });

  afterAll(async () => {
    await scratch.end();
    await onServer(`DROP DATABASE IF EXISTS ${SCRATCH_DB}`);
  });

  it("turns staff into visitors and keeps recorded attendance", async () => {
    const insertUser = `INSERT INTO users (name, email, phone, password_hash, role, badge_code)
      VALUES ('Person', $1, '0500000000', 'hash', $2, $3) RETURNING id`;
    const staff = await scratch.query(insertUser, ["staff@example.com", "staff", "FWSTAFF"]);
    const admin = await scratch.query(insertUser, ["admin@example.com", "admin", "FWADMIN"]);
    await scratch.query(`INSERT INTO check_ins (user_id, event_date, checked_in_by) VALUES ($1, '2026-12-13', $2)`, [
      admin.rows[0].id,
      staff.rows[0].id,
    ]);

    await applyMigration(scratch, 3);

    const roles = await scratch.query(`SELECT email, role::text FROM users ORDER BY email`);
    expect(roles.rows).toEqual([
      { email: "admin@example.com", role: "admin" },
      { email: "staff@example.com", role: "visitor" },
    ]);
    const attendance = await scratch.query(`SELECT event_date::text AS date FROM check_ins`);
    expect(attendance.rows).toEqual([{ date: "2026-12-13" }]);
    const labels = await scratch.query(`SELECT enumlabel FROM pg_enum ORDER BY enumlabel`);
    expect(labels.rows.map((row) => row.enumlabel)).not.toContain("staff");
    const column = await scratch.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name = 'check_ins' AND column_name = 'checked_in_by'`,
    );
    expect(column.rowCount).toBe(0);
  });

  it("offers only the visitor and admin roles", () => {
    expect(ROLE_LIST).toEqual(["visitor", "admin"]);
  });
});
