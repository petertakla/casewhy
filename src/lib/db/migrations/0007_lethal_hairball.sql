CREATE TABLE "disabled_news_sources" (
	"user_id" text NOT NULL,
	"source_id" text NOT NULL,
	CONSTRAINT "disabled_news_sources_user_id_source_id_pk" PRIMARY KEY("user_id","source_id")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"status_change_emails_enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
