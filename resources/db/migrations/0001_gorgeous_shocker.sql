CREATE TABLE IF NOT EXISTS "pool_sharing_tweets" (
	"tweetId" varchar(100) PRIMARY KEY NOT NULL,
	"poolId" varchar(44) NOT NULL,
	"playerAddress" varchar(44) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_sharing_tweets" ADD CONSTRAINT "pool_sharing_tweets_playerAddress_players_address_fk" FOREIGN KEY ("playerAddress") REFERENCES "public"."players"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_poolId" ON "pool_sharing_tweets" USING btree ("poolId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_playerAddress" ON "pool_sharing_tweets" USING btree ("playerAddress");