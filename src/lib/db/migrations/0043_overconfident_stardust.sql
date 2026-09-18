CREATE TABLE "tiktok_oauth_token" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"access_token" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"refresh_token" text NOT NULL,
	"open_id" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
