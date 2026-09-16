CREATE TABLE "uscis_api_call_log" (
	"id" text PRIMARY KEY NOT NULL,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "uscis_api_call_log_called_at_idx" ON "uscis_api_call_log" USING btree ("called_at");