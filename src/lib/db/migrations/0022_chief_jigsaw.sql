CREATE TABLE "disciplined_practitioners" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"city_state" text NOT NULL,
	"states" text NOT NULL,
	"date_immediate_suspension" text,
	"final_discipline_imposed" text,
	"effective_date" text,
	"reinstated" boolean DEFAULT false NOT NULL,
	"source_citation" text NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accredited_representative_applications" ADD COLUMN "discipline_match_note" text;--> statement-breakpoint
ALTER TABLE "attorney_applications" ADD COLUMN "discipline_match_note" text;--> statement-breakpoint
ALTER TABLE "pro_bono_representation_applications" ADD COLUMN "discipline_match_note" text;--> statement-breakpoint
CREATE INDEX "disciplined_practitioners_normalized_name_idx" ON "disciplined_practitioners" USING btree ("normalized_name");