CREATE TYPE "public"."marketing_channel" AS ENUM('reddit', 'facebook', 'visajourney', 'trackitt', 'immigration_com', 'quora', 'x', 'threads', 'linkedin', 'pinterest', 'youtube', 'tiktok', 'instagram', 'email');--> statement-breakpoint
CREATE TYPE "public"."marketing_mode" AS ENUM('manual_post', 'auto_post');--> statement-breakpoint
CREATE TYPE "public"."marketing_queue_status" AS ENUM('pending', 'approved', 'posted', 'edited_posted', 'rejected', 'escalated');--> statement-breakpoint
CREATE TABLE "community_source_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" "marketing_channel" NOT NULL,
	"source_identifier" text NOT NULL,
	"label" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" "marketing_channel" NOT NULL,
	"mode" "marketing_mode" DEFAULT 'manual_post' NOT NULL,
	"destination" text NOT NULL,
	"draft_text" text,
	"source_citations" text,
	"guardrail_notes" text,
	"status" "marketing_queue_status" DEFAULT 'pending' NOT NULL,
	"posted_at" timestamp with time zone,
	"posted_url" text,
	"engagement_snapshot" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_queue_channel_destination_unique" UNIQUE("channel","destination")
);
--> statement-breakpoint
CREATE INDEX "marketing_queue_status_idx" ON "marketing_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "marketing_queue_channel_idx" ON "marketing_queue" USING btree ("channel");