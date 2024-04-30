CREATE TABLE IF NOT EXISTS bets (
	"id"                    UUID            NOT NULL PRIMARY KEY,
	"creator"               VARCHAR(42)     NOT NULL,
	"creationTimestamp"     NUMERIC(20)     NOT NULL,
	"acceptor"              VARCHAR(42),
    "acceptanceTimestamp"   NUMERIC(20),
	"ticker"                VARCHAR(20)     NOT NULL,
	"metric"                VARCHAR(40)     NOT NULL,
	"isBetOnUp"             BOOLEAN         NOT NULL,
	"expirationTimestamp"   NUMERIC(20)     NOT NULL,
	"value"                 NUMERIC(256)    NOT NULL,
	"currency"              VARCHAR(42)     NOT NULL,
	"startingMetricValue"   NUMERIC(42),
	"endingMetricValue"     NUMERIC(42),
	"winner"                VARCHAR(42),
    "isWithdrawn"           BOOLEAN         NOT NULL DEFAULT false,
    "withdrawalTimestamp"    NUMERIC(20),
    "lastActivityTimestamp" NUMERIC(20)     NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_currency" ON bets("currency");
CREATE INDEX IF NOT EXISTS "idx_ticker" ON bets("ticker");
CREATE INDEX IF NOT EXISTS "idx_acceptor" ON bets("acceptor");
CREATE INDEX IF NOT EXISTS "idx_creator" ON bets("creator");
CREATE INDEX IF NOT EXISTS "idx_expirationTimestamp" ON bets("expirationTimestamp");
CREATE INDEX IF NOT EXISTS "idx_lastActivityTimestamp" ON bets("lastActivityTimestamp");