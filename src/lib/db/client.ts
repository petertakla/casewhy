// Lazy-init DB client. A plain function, not a Proxy — Neon Auth's adapter
// introspection breaks against a Proxy-wrapped Drizzle instance.

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";

let pool: Pool | undefined;

export function getDb() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    attachDatabasePool(pool);
  }
  return drizzle(pool, { schema });
}
