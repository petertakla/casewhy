CREATE TYPE "public"."pending_backlink_outreach_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "pending_backlink_outreach" (
	"id" text PRIMARY KEY NOT NULL,
	"attorney_id" text NOT NULL,
	"attorney_name" text NOT NULL,
	"attorney_email" text NOT NULL,
	"listing_url" text NOT NULL,
	"draft_subject" text NOT NULL,
	"draft_body" text NOT NULL,
	"status" "pending_backlink_outreach_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_backlink_outreach_attorney_id_unique" UNIQUE("attorney_id")
);
--> statement-breakpoint
CREATE INDEX "pending_backlink_outreach_status_idx" ON "pending_backlink_outreach" USING btree ("status");