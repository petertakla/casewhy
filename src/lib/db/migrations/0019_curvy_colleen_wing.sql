ALTER TABLE "subscriptions" ADD COLUMN "effective_max_cases" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "pending_approval_token" text;--> statement-breakpoint
ALTER TABLE "tracked_cases" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;