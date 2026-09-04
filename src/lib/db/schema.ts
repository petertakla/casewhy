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
    // AES-256-GCM ciphertext (base64), not plaintext — see src/lib/db/crypto.ts.
    receiptNumber: text("receipt_number").notNull(),
    // Encrypted, denormalized from session.user.email at track-time — used
    // to send status-change notifications without querying Neon Auth's
    // own neon_auth schema directly.
    email: text("email").notNull(),
    // Encrypted; last status text seen by the status-change cron. Null
    // until the first cron run after tracking.
    lastStatusText: text("last_status_text"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tracked_cases_user_id_idx").on(table.userId)]
);
