DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "winTimestamp" NUMERIC(20);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "winTimestamp" already exists in bets.';
    END
$$;

CREATE INDEX IF NOT EXISTS "idx_winTimestamp" ON bets("winTimestamp");

DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "strikePriceCreator" VARCHAR(42);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "strikePriceCreator" already exists in bets.';
    END
$$;

DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "strikePriceAcceptor" VARCHAR(42);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "strikePriceAcceptor" already exists in bets.';
    END
$$;

DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "type" VARCHAR(20) NOT NULL DEFAULT 'binary';
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "type" already exists in bets.';
    END
$$;

DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "isPaid" already exists in bets.';
    END
$$;

DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN chain VARCHAR(10) NOT NULL DEFAULT 'base';
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "chain" already exists in bets.';
    END
$$;

DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "paidTx" VARCHAR(66);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "paidTx" already exists in bets.';
    END
$$;

CREATE INDEX IF NOT EXISTS "idx_chain" ON bets("chain");
CREATE INDEX IF NOT EXISTS "idx_type" ON bets("type");