CREATE TABLE IF NOT EXISTS users (
    "address"               VARCHAR(42)     NOT NULL PRIMARY KEY,
    "betsParticipatedIn"    INTEGER         NOT NULL DEFAULT 0,
    "avatarUrl"             TEXT
)

CREATE INDEX IF NOT EXISTS "idx_betsParticipatedIn" ON users("betsParticipatedIn");

-- Seed with bets table data
DO $$
    BEGIN
        -- bet creators
        INSERT INTO users (userAddress, betsParticipatedIn)
        SELECT
            LOWER(creator) AS userAddress,
            COUNT(*) AS betsParticipatedIn
        FROM bets
        WHERE chain = 'base'
        GROUP BY LOWER(creator)
        ON CONFLICT (userAddress) DO UPDATE
        SET betsParticipatedIn = users.betsParticipatedIn + EXCLUDED.betsParticipatedIn;

        -- bet acceptors
        INSERT INTO users (userAddress, betsParticipatedIn)
        SELECT
            LOWER(acceptor) AS userAddress,
            COUNT(*) AS betsParticipatedIn
        FROM bets
        WHERE acceptor IS NOT NULL AND chain = 'base'
        GROUP BY LOWER(acceptor)
        ON CONFLICT (userAddress) DO UPDATE
        SET betsParticipatedIn = users.betsParticipatedIn + EXCLUDED.betsParticipatedIn;
    END
$$;
