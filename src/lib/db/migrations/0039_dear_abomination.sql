CREATE TYPE "public"."content_brief_format" AS ENUM('pin', 'short_video', 'square_graphic', 'story');--> statement-breakpoint
CREATE TYPE "public"."content_brief_pillar" AS ENUM('founder-story', 'status-explained', 'processing-times', 'visa-bulletin', 'delays-and-escalation', 'get-help', 'not-sure-who-to-ask');--> statement-breakpoint
CREATE TYPE "public"."content_brief_status" AS ENUM('pending', 'rendering', 'rendered', 'failed');--> statement-breakpoint
CREATE TABLE "content_briefs" (
	"id" text PRIMARY KEY NOT NULL,
	"pillar" "content_brief_pillar" NOT NULL,
	"format" "content_brief_format" NOT NULL,
	"headline" text NOT NULL,
	"body_copy" text NOT NULL,
	"image_prompt" text NOT NULL,
	"video_script" text,
	"sources" text NOT NULL,
	"target_channels" text NOT NULL,
	"schedule_after" timestamp with time zone DEFAULT now() NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"status" "content_brief_status" DEFAULT 'pending' NOT NULL,
	"rendered_asset_url" text,
	"render_error" text,
	"rendered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "marketing_settings" ADD COLUMN "pinterest_board_es" text;--> statement-breakpoint
ALTER TABLE "marketing_settings" ADD COLUMN "youtube_channel_es" text;--> statement-breakpoint
ALTER TABLE "marketing_settings" ADD COLUMN "tiktok_account_es" text;--> statement-breakpoint
ALTER TABLE "marketing_settings" ADD COLUMN "instagram_account_es" text;--> statement-breakpoint
ALTER TABLE "marketing_settings" ADD COLUMN "gemini_video_monthly_cap" integer DEFAULT 8 NOT NULL;--> statement-breakpoint
CREATE INDEX "content_briefs_status_idx" ON "content_briefs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_briefs_pillar_idx" ON "content_briefs" USING btree ("pillar");