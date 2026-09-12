ALTER TABLE "case_status_history" ADD COLUMN "status_description" text;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD COLUMN "event_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD COLUMN "filing_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD COLUMN "source" text DEFAULT 'history_sync' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_dedup_unique" UNIQUE("tracked_case_id","status_text","event_date");