CREATE TABLE "news_items" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"source_name" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"title_hash" text NOT NULL,
	"raw_summary" text,
	"published_at" timestamp with time zone,
	"kb_related_memo_ids" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "news_items_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "marketing_queue" DROP CONSTRAINT "marketing_queue_channel_destination_unique";--> statement-breakpoint
ALTER TABLE "marketing_queue" ADD COLUMN "locale" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "marketing_settings" ADD COLUMN "spanish_social_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "news_items_title_hash_idx" ON "news_items" USING btree ("title_hash");--> statement-breakpoint
ALTER TABLE "marketing_queue" ADD CONSTRAINT "marketing_queue_channel_destination_locale_unique" UNIQUE("channel","destination","locale");