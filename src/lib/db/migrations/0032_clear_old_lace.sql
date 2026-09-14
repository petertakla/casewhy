CREATE TABLE "first_touch_attribution" (
	"user_id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"medium" text NOT NULL,
	"campaign" text NOT NULL,
	"first_touch_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_landing_counts" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"medium" text NOT NULL,
	"campaign" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketing_landing_counts_source_medium_campaign_unique" UNIQUE("source","medium","campaign")
);
