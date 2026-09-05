CREATE TABLE "case_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tracked_case_id" text NOT NULL,
	"user_id" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"blob_pathname" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_documents" ADD CONSTRAINT "case_documents_tracked_case_id_tracked_cases_id_fk" FOREIGN KEY ("tracked_case_id") REFERENCES "public"."tracked_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_documents_tracked_case_id_idx" ON "case_documents" USING btree ("tracked_case_id");