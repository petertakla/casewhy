CREATE TYPE "public"."alias_action_level" AS ENUM('draft_only', 'draft_and_flag_urgent');--> statement-breakpoint
CREATE TYPE "public"."pending_alias_action_status" AS ENUM('pending', 'approved', 'rejected', 'sent');--> statement-breakpoint
CREATE TABLE "email_alias_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"alias" text NOT NULL,
	"purpose" text NOT NULL,
	"gmail_label" text NOT NULL,
	"poll_interval_minutes" integer NOT NULL,
	"action_level" "alias_action_level" DEFAULT 'draft_only' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_polled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_alias_configs_alias_unique" UNIQUE("alias")
);
--> statement-breakpoint
CREATE TABLE "pending_alias_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"alias_config_id" text NOT NULL,
	"gmail_message_id" text NOT NULL,
	"from_address" text NOT NULL,
	"subject" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"summary" text NOT NULL,
	"draft_reply" text,
	"proposed_action" text,
	"status" "pending_alias_action_status" DEFAULT 'pending' NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pending_alias_actions_gmail_message_id_unique" UNIQUE("gmail_message_id")
);
--> statement-breakpoint
CREATE INDEX "pending_alias_actions_alias_config_id_idx" ON "pending_alias_actions" USING btree ("alias_config_id");--> statement-breakpoint
CREATE INDEX "pending_alias_actions_status_idx" ON "pending_alias_actions" USING btree ("status");