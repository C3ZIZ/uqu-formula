// The one shared database connection pool for this process.
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { LIMITS } from "@/config/limits";
import * as schema from "./schema";

type Database = NodePgDatabase<typeof schema>;

const shared = globalThis as unknown as { formulaDb?: Database; formulaPool?: Pool };

shared.formulaPool ??= new Pool({
  connectionString: process.env.DATABASE_URL,
  max: LIMITS.dbPoolMax,
  idleTimeoutMillis: LIMITS.dbIdleMs,
  connectionTimeoutMillis: LIMITS.dbConnectMs,
});

export const pool = shared.formulaPool;

shared.formulaDb ??= drizzle(pool, { schema });

export const db = shared.formulaDb;
