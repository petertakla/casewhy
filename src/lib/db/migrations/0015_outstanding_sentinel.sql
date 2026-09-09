CREATE TABLE "legal_aid_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_name" text NOT NULL,
	"org_type" text NOT NULL,
	"contact_person" text NOT NULL,
	"states_served" text NOT NULL,
	"population_served" text NOT NULL,
	"services_offered" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_aid_directory" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"organization_name" text NOT NULL,
	"org_type" text,
	"contact_person" text,
	"population_served" text,
	"services_offered" text,
	"organization_status" text NOT NULL,
	"organization_recognized_date" text,
	"organization_recognition_expiration" text,
	"organization_recognition_pending_renewal" boolean DEFAULT false NOT NULL,
	"office_type" text,
	"street_address" text,
	"city_state_zip" text,
	"phone" text,
	"state" text NOT NULL,
	"source_citation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "legal_aid_directory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "legal_aid_directory_state_idx" ON "legal_aid_directory" USING btree ("state");