CREATE TABLE "community_org_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_name" text NOT NULL,
	"org_type" text NOT NULL,
	"contact_person" text NOT NULL,
	"states_served" text NOT NULL,
	"population_served" text NOT NULL,
	"services_offered" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_org_directory" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"organization_name" text NOT NULL,
	"city_state_zip" text,
	"state" text NOT NULL,
	"description" text,
	"fiscal_years_awarded" text NOT NULL,
	"website_url" text,
	"data_source" text DEFAULT 'uscis_cigp' NOT NULL,
	"source_citation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_org_directory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "dso_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"school_name" text NOT NULL,
	"campus_name" text,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"website_url" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dso_directory" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"school_name" text NOT NULL,
	"campus_name" text,
	"is_main_campus" boolean DEFAULT false NOT NULL,
	"f1_certified" boolean DEFAULT false NOT NULL,
	"m1_certified" boolean DEFAULT false NOT NULL,
	"street_address" text,
	"city_state_zip" text,
	"state" text NOT NULL,
	"phone" text,
	"website_url" text,
	"data_source" text DEFAULT 'dhs_study_in_the_states' NOT NULL,
	"source_citation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dso_directory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "community_org_directory_state_idx" ON "community_org_directory" USING btree ("state");--> statement-breakpoint
CREATE INDEX "dso_directory_state_idx" ON "dso_directory" USING btree ("state");