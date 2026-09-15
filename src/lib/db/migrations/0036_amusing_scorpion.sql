CREATE TABLE "search_events" (
	"id" text PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"locale" text NOT NULL,
	"result_counts" text NOT NULL,
	"outcome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "search_events_created_at_idx" ON "search_events" USING btree ("created_at");