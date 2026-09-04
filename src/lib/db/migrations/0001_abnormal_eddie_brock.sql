ALTER TABLE "tracked_cases" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tracked_cases" ADD COLUMN "last_status_text" text;--> statement-breakpoint
ALTER TABLE "tracked_cases" ADD COLUMN "last_checked_at" timestamp with time zone;