ALTER TYPE "public"."marketing_channel" ADD VALUE 'outreach';--> statement-breakpoint
ALTER TYPE "public"."marketing_queue_status" ADD VALUE 'skipped';--> statement-breakpoint
ALTER TABLE "marketing_queue" ADD COLUMN "media_refs" text;--> statement-breakpoint
ALTER TABLE "marketing_queue" ADD COLUMN "utm_link" text;