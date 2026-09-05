CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'plus');--> statement-breakpoint
CREATE TABLE "chat_usage" (
	"user_id" text NOT NULL,
	"year_month" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "chat_usage_user_id_year_month_pk" PRIMARY KEY("user_id","year_month")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" text PRIMARY KEY NOT NULL,
	"tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "tracked_cases_user_id_idx";--> statement-breakpoint
CREATE INDEX "tracked_cases_user_id_idx" ON "tracked_cases" USING btree ("user_id");