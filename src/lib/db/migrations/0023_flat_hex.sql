CREATE TYPE "public"."policy_type" AS ENUM('tos', 'privacy');--> statement-breakpoint
CREATE TABLE "case_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"tracked_case_id" text NOT NULL,
	"case_type" text,
	"service_prefix" text NOT NULL,
	"status_text" text NOT NULL,
	"milestone_date" timestamp with time zone,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_acknowledgments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"policy_type" "policy_type" NOT NULL,
	"version" text NOT NULL,
	"acknowledged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "case_status_history_tracked_case_id_idx" ON "case_status_history" USING btree ("tracked_case_id");--> statement-breakpoint
CREATE INDEX "policy_acknowledgments_user_id_idx" ON "policy_acknowledgments" USING btree ("user_id");