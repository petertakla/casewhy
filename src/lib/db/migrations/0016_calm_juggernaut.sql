CREATE TABLE "attorney_directory" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"firm" text,
	"states_licensed" text NOT NULL,
	"bar_number" text,
	"practice_focus" text NOT NULL,
	"website_url" text,
	"phone" text,
	"email" text,
	"street_address" text,
	"city_state_zip" text,
	"source_citation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attorney_directory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "attorney_applications" ADD COLUMN "website_url" text;