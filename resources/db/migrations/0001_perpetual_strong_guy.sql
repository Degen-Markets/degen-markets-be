CREATE TABLE IF NOT EXISTS "players" (
	"address" varchar PRIMARY KEY NOT NULL,
	"name" varchar(20),
	"avatarUrl" text,
	"chain" varchar(20) DEFAULT 'base' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_points" ON "players" USING btree ("points");