CREATE TABLE "tracked_cases" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tracked_cases_user_id_idx" ON "tracked_cases" USING btree ("user_id");