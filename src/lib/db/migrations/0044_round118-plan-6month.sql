-- Round 118 — retires the $22.99/quarterly plan in favor of a $39.99/
-- 6-month plan, and bumps annual to $69.99. drizzle-kit generated this as
-- a drop-and-recreate of the plan_id enum (it doesn't detect value
-- renames), so any existing row still holding the literal text
-- 'plus_quarterly' has to be renamed to 'plus_6month' *while the column is
-- text* (between the two ALTER COLUMN steps below) or the final enum cast
-- fails for that row. Doing the rename here, in the same migration, is
-- simpler and safer than a separate follow-up UPDATE that could run out of
-- order.
ALTER TABLE "plan_prices" ALTER COLUMN "plan_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "pricing_rules" ALTER COLUMN "plan_id" SET DATA TYPE text;--> statement-breakpoint
UPDATE "plan_prices" SET "plan_id" = 'plus_6month' WHERE "plan_id" = 'plus_quarterly';--> statement-breakpoint
UPDATE "pricing_rules" SET "plan_id" = 'plus_6month' WHERE "plan_id" = 'plus_quarterly';--> statement-breakpoint
DROP TYPE "public"."plan_id";--> statement-breakpoint
CREATE TYPE "public"."plan_id" AS ENUM('plus_monthly', 'plus_6month', 'plus_annual');--> statement-breakpoint
ALTER TABLE "plan_prices" ALTER COLUMN "plan_id" SET DATA TYPE "public"."plan_id" USING "plan_id"::"public"."plan_id";--> statement-breakpoint
ALTER TABLE "pricing_rules" ALTER COLUMN "plan_id" SET DATA TYPE "public"."plan_id" USING "plan_id"::"public"."plan_id";--> statement-breakpoint
UPDATE "plan_prices" SET "interval_count" = 6, "base_price_cents" = 3999 WHERE "plan_id" = 'plus_6month';--> statement-breakpoint
UPDATE "plan_prices" SET "base_price_cents" = 6999 WHERE "plan_id" = 'plus_annual';