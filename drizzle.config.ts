import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Direct (non-pooled) connection — required for migrations.
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
