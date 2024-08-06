CREATE TABLE IF NOT EXISTS players (
    "address"               VARCHAR(42)     NOT NULL PRIMARY KEY,
    "avatarUrl"             TEXT,
    chain                   VARCHAR(10)     NOT NULL DEFAULT 'base',
    points                  INTEGER         NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "idx_points" ON players("points");
