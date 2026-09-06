CREATE TABLE "stripe_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "current_period_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;