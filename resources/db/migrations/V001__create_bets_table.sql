CREATE TABLE IF NOT EXISTS bets (
	"id"                  VARCHAR(256)   NOT NULL PRIMARY KEY,
	"creator"             VARCHAR(256)   NOT NULL,
	"creationTimestamp"   TIMESTAMPTZ    NOT NULL,
	"acceptor"            VARCHAR(256),
	"ticker"              TEXT           NOT NULL,
	"metric"              VARCHAR(256)   NOT NULL,
	"isBetOnUp"           BOOLEAN        NOT NULL,
	"expiresAt"           TIMESTAMPTZ    NOT NULL,
	"value"               NUMERIC(12, 4) NOT NULL,
	"currency"            VARCHAR(24)    NOT NULL,
	"startingMetricValue" NUMERIC(12, 4),
	"endingMetricValue"   NUMERIC(12, 4),
	"winner"              VARCHAR(256)
);

CREATE INDEX IF NOT EXISTS "idx_currency" ON bets("currency");
CREATE INDEX IF NOT EXISTS "idx_ticker" ON bets("ticker");
CREATE INDEX IF NOT EXISTS "idx_acceptor" ON bets("acceptor");
CREATE INDEX IF NOT EXISTS "idx_creator" ON bets("creator");
CREATE INDEX IF NOT EXISTS "idx_expiresAt" ON bets("expiresAt");