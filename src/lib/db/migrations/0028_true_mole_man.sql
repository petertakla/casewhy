CREATE TYPE "public"."community_reply_status" AS ENUM('pending', 'approved', 'rejected', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."community_source" AS ENUM('reddit', 'rss');--> statement-breakpoint
CREATE TABLE "pending_community_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"source" "community_source" NOT NULL,
	"source_name" text NOT NULL,
	"thread_url" text NOT NULL,
	"thread_title" text NOT NULL,
	"thread_excerpt" text NOT NULL,
	"relevance_reason" text NOT NULL,
	"draft_reply" text,
	"escalation_reason" text,
	"source_citation" text,
	"self_promo_note" text,
	"status" "community_reply_status" DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_community_replies_thread_url_unique" UNIQUE("thread_url")
);
--> statement-breakpoint
CREATE INDEX "pending_community_replies_status_idx" ON "pending_community_replies" USING btree ("status");