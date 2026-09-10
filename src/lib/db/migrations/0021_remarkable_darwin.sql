CREATE TABLE "pro_bono_representation_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_name" text NOT NULL,
	"contact_person" text NOT NULL,
	"immigration_courts_served" text NOT NULL,
	"languages" text,
	"case_type_limits" text,
	"intake_policy" text,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pro_bono_representation_directory" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"organization_name" text NOT NULL,
	"street_address" text,
	"city_state_zip" text,
	"state" text NOT NULL,
	"immigration_court" text NOT NULL,
	"phone" text,
	"email" text,
	"website" text,
	"languages" text,
	"case_type_limits" text,
	"intake_policy" text,
	"is_referral_service" boolean DEFAULT false NOT NULL,
	"source_citation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pro_bono_representation_directory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "pro_bono_representation_directory_state_idx" ON "pro_bono_representation_directory" USING btree ("state");