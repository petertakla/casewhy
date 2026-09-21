CREATE TABLE "receipt_lookups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "receipt_lookups_user_id_idx" ON "receipt_lookups" USING btree ("user_id");