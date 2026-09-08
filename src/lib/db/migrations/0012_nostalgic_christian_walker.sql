CREATE TABLE "representative_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"organization" text NOT NULL,
	"accreditation_details" text NOT NULL,
	"states_served" text NOT NULL,
	"practice_focus" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
