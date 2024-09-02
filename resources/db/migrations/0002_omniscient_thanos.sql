CREATE TABLE IF NOT EXISTS "pool_entrants" (
	"address" varchar(44) PRIMARY KEY NOT NULL,
	"points" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pool_entries" (
	"address" varchar(44) PRIMARY KEY NOT NULL,
	"entrant" varchar(44) NOT NULL,
	"option" varchar(44) NOT NULL,
	"pool" varchar(44) NOT NULL,
	"value" bigint NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_entries" ADD CONSTRAINT "pool_entries_entrant_pool_entrants_address_fk" FOREIGN KEY ("entrant") REFERENCES "public"."pool_entrants"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_entrant" ON "pool_entries" USING btree ("entrant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_option" ON "pool_entries" USING btree ("option");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pool" ON "pool_entries" USING btree ("pool");