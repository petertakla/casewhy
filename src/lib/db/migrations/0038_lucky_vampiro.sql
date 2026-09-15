ALTER TABLE "employer_leads" ALTER COLUMN "company" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employer_leads" ALTER COLUMN "team_size" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employer_leads" ALTER COLUMN "contact_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "employer_leads" ADD COLUMN "kind" text DEFAULT 'employer' NOT NULL;