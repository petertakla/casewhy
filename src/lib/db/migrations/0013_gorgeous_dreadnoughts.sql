CREATE TABLE "attorney_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"firm" text NOT NULL,
	"states_licensed" text NOT NULL,
	"bar_number" text NOT NULL,
	"practice_areas" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
