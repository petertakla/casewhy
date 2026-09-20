CREATE TABLE "social_channel_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"channel" "marketing_channel" NOT NULL,
	"min_interval_minutes" integer DEFAULT 0 NOT NULL,
	"mode" "marketing_mode" DEFAULT 'manual_post' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_channel_configs_channel_unique" UNIQUE("channel")
);
--> statement-breakpoint
ALTER TABLE "email_alias_configs" ADD COLUMN "notes" text;
--> statement-breakpoint
-- Round 119 — seed today's real, already-live default for each channel
-- this pipeline actually posts through, so adding this table changes no
-- behavior until Peter edits a row. Mirrors poll-policy-news's hardcoded
-- "auto_post" for x/threads/facebook, the evergreen fallback's same
-- defaults, and gemini/render-brief.ts's CHANNEL_MODE map for
-- pinterest/youtube/tiktok/instagram. facebook's mode here is
-- informational only (see schema.ts's own comment) -- its real mode is
-- still decided per call site (Page vs Group), never by this row.
INSERT INTO "social_channel_configs" ("id", "channel", "min_interval_minutes", "mode", "enabled") VALUES
  ('efc57dd4-546b-489d-816d-f0804b440efc', 'x', 0, 'auto_post', true),
  ('eb5642e2-d4df-42dc-81db-bb6370a71e4c', 'threads', 0, 'auto_post', true),
  ('e52229d8-6f1d-41ae-96dd-df1a06f7d644', 'facebook', 0, 'auto_post', true),
  ('67a64967-ddb5-4781-a035-ca7309830680', 'instagram', 0, 'auto_post', true),
  ('69addfbc-76cf-48e0-afd7-0fbd5b03a824', 'pinterest', 0, 'auto_post', true),
  ('52692cfc-1808-4e99-b5a8-adbf279d086c', 'youtube', 0, 'auto_post', true),
  ('c3f20f2f-0963-4d09-bdf4-bfb5a6e0b558', 'tiktok', 0, 'auto_post', true)
ON CONFLICT ("channel") DO NOTHING;