ALTER TABLE "pools" ALTER COLUMN "description" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "pools" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "pools" ALTER COLUMN "image" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_sharing_tweets" ADD CONSTRAINT "pool_sharing_tweets_pool_pools_address_fk" FOREIGN KEY ("pool") REFERENCES "public"."pools"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
