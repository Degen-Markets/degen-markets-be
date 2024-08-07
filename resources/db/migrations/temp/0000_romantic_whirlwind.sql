CREATE TABLE IF NOT EXISTS "bets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"creator" varchar(42) NOT NULL,
	"creationTimestamp" numeric(20) NOT NULL,
	"acceptor" varchar(42),
	"acceptanceTimestamp" numeric(20),
	"ticker" varchar(20) NOT NULL,
	"metric" varchar(40) NOT NULL,
	"isBetOnUp" boolean NOT NULL,
	"expirationTimestamp" numeric(20) NOT NULL,
	"value" numeric(256) NOT NULL,
	"currency" varchar(42) NOT NULL,
	"startingMetricValue" varchar(42),
	"endingMetricValue" varchar(42),
	"winner" varchar(42),
	"isWithdrawn" boolean DEFAULT false NOT NULL,
	"withdrawalTimestamp" numeric(20),
	"lastActivityTimestamp" numeric(20) NOT NULL,
	"winTimestamp" numeric(20),
	"strikePriceCreator" varchar(42),
	"strikePriceAcceptor" varchar(42),
	"type" varchar(20) DEFAULT 'binary' NOT NULL,
	"isPaid" boolean DEFAULT false NOT NULL,
	"chain" varchar(10) DEFAULT 'base' NOT NULL,
	"paidTx" varchar(66)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_currency" ON "bets" USING btree ("currency");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ticker" ON "bets" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_acceptor" ON "bets" USING btree ("acceptor");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creator" ON "bets" USING btree ("creator");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_winner" ON "bets" USING btree ("winner");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expirationTimestamp" ON "bets" USING btree ("expirationTimestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lastActivityTimestamp" ON "bets" USING btree ("lastActivityTimestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_acceptanceTimestamp" ON "bets" USING btree ("acceptanceTimestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_withdrawalTimestamp" ON "bets" USING btree ("withdrawalTimestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_creationTimestamp" ON "bets" USING btree ("creationTimestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_winTimestamp" ON "bets" USING btree ("winTimestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chain" ON "bets" USING btree ("chain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_type" ON "bets" USING btree ("type");