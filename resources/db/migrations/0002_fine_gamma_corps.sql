CREATE TABLE IF NOT EXISTS "pool_options" (
	"address" varchar(44) PRIMARY KEY NOT NULL,
	"pool" varchar(44) NOT NULL,
	"title" varchar(100) NOT NULL,
	"value" numeric(50, 0) NOT NULL,
	"isWinningOption" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pools" (
	"address" varchar(44) PRIMARY KEY NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" varchar(200),
	"image" varchar(100),
	"isPaused" boolean NOT NULL,
	"value" numeric(50, 0) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_options" ADD CONSTRAINT "pool_options_pool_pools_address_fk" FOREIGN KEY ("pool") REFERENCES "public"."pools"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_poolOptions_pool" ON "pool_options" USING btree ("pool");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pools_value" ON "pools" USING btree ("value");