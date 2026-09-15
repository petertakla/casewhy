CREATE TABLE "marketing_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"daily_draft_cap" integer DEFAULT 5 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
