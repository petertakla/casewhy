CREATE TABLE "accredited_representative_directory" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"representative_name" text NOT NULL,
	"dhs_only" boolean NOT NULL,
	"accreditation_expiration" text,
	"accreditation_pending_renewal" boolean DEFAULT false NOT NULL,
	"organization_name" text NOT NULL,
	"organization_status" text NOT NULL,
	"organization_recognition_expiration" text,
	"organization_recognition_pending_renewal" boolean DEFAULT false NOT NULL,
	"office_type" text,
	"street_address" text,
	"city_state_zip" text,
	"phone" text,
	"state" text NOT NULL,
	"source_citation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accredited_representative_directory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "representative_applications" RENAME TO "accredited_representative_applications";--> statement-breakpoint
CREATE INDEX "accredited_representative_directory_state_idx" ON "accredited_representative_directory" USING btree ("state");