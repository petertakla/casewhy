CREATE TYPE "public"."escalation_letter_type" AS ENUM('congressional', 'field_office', 'ombudsman');--> statement-breakpoint
CREATE TABLE "escalation_letters" (
	"id" text PRIMARY KEY NOT NULL,
	"tracked_case_id" text NOT NULL,
	"user_id" text NOT NULL,
	"letter_type" "escalation_letter_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailing_addresses" (
	"user_id" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "escalation_letters" ADD CONSTRAINT "escalation_letters_tracked_case_id_tracked_cases_id_fk" FOREIGN KEY ("tracked_case_id") REFERENCES "public"."tracked_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "escalation_letters_tracked_case_id_idx" ON "escalation_letters" USING btree ("tracked_case_id");