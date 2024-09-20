CREATE TABLE IF NOT EXISTS "pool_options" (
	"id" varchar(44) PRIMARY KEY NOT NULL,
	"pool_id" varchar(44) NOT NULL,
	"title" varchar(255) NOT NULL,
	"value" numeric(50, 0) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pools" (
	"id" varchar(44) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar(5000),
	"image" varchar(1000),
	"is_paused" boolean,
	"winning_option" varchar(44),
	"value" numeric(50, 0) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_options" ADD CONSTRAINT "pool_options_pool_id_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pool_id" ON "pool_options" USING btree ("pool_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_winning_option" ON "pools" USING btree ("winning_option");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_entries" ADD CONSTRAINT "pool_entries_option_pool_options_id_fk" FOREIGN KEY ("option") REFERENCES "public"."pool_options"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_entries" ADD CONSTRAINT "pool_entries_pool_pools_id_fk" FOREIGN KEY ("pool") REFERENCES "public"."pools"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
