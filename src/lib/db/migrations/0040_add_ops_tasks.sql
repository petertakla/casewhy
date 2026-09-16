CREATE TYPE "public"."ops_task_status" AS ENUM('pending', 'done', 'dismissed');--> statement-breakpoint
CREATE TABLE "ops_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "ops_task_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "ops_tasks_type_status_idx" ON "ops_tasks" USING btree ("type","status");