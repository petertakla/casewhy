CREATE TYPE "public"."billing_interval" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."plan_id" AS ENUM('plus_monthly', 'plus_quarterly', 'plus_annual');--> statement-breakpoint
CREATE TYPE "public"."pricing_adjustment_type" AS ENUM('fixed_amount', 'percent');--> statement-breakpoint
CREATE TABLE "plan_prices" (
	"plan_id" "plan_id" PRIMARY KEY NOT NULL,
	"base_price_cents" integer NOT NULL,
	"billing_interval" "billing_interval" NOT NULL,
	"interval_count" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" "plan_id" NOT NULL,
	"adjustment_type" "pricing_adjustment_type" NOT NULL,
	"adjustment_value" integer NOT NULL,
	"effective_start" timestamp with time zone NOT NULL,
	"effective_end" timestamp with time zone,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pricing_rules_plan_id_idx" ON "pricing_rules" USING btree ("plan_id");--> statement-breakpoint
INSERT INTO "plan_prices" ("plan_id", "base_price_cents", "billing_interval", "interval_count") VALUES
	('plus_monthly', 999, 'month', 1),
	('plus_quarterly', 2299, 'month', 3),
	('plus_annual', 6699, 'year', 1)
ON CONFLICT ("plan_id") DO NOTHING;