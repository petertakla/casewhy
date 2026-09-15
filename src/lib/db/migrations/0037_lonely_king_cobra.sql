CREATE TABLE "attorney_outreach" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"firm" text NOT NULL,
	"contact_name" text,
	"email" text NOT NULL,
	"bar_state" text,
	"status" text DEFAULT 'not_contacted' NOT NULL,
	"suppressed" boolean DEFAULT false NOT NULL,
	"applied" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attorney_outreach_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "employer_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"team_size" text NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"needs" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
