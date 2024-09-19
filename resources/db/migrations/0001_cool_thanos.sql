CREATE TABLE IF NOT EXISTS "pool_sharing_tweets" (
	"tweetId" varchar(100) PRIMARY KEY NOT NULL,
	"pool" varchar(44) NOT NULL,
	"player" varchar(44) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pool_sharing_tweets" ADD CONSTRAINT "pool_sharing_tweets_player_players_address_fk" FOREIGN KEY ("player") REFERENCES "public"."players"("address") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pool_sharing_tweets_pool" ON "pool_sharing_tweets" USING btree ("pool");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pool_sharing_tweets_player" ON "pool_sharing_tweets" USING btree ("player");