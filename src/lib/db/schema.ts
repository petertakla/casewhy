// Drizzle schema for CaseWhy's own tables. Neon Auth manages its own
// `neon_auth` schema (users, sessions) separately — never migrated here.

import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const trackedCases = pgTable(
  "tracked_cases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    // Neon Auth's user id (from session.user.id). Unique — one free
    // tracked case per account, per the MVP scope.
    userId: text("user_id").notNull(),
    receiptNumber: text("receipt_number").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tracked_cases_user_id_idx").on(table.userId)]
);
