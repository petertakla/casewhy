CREATE TABLE "news_source_preferences" (
	"user_id" text NOT NULL,
	"source_id" text NOT NULL,
	"enabled" boolean NOT NULL,
	CONSTRAINT "news_source_preferences_user_id_source_id_pk" PRIMARY KEY("user_id","source_id")
);
