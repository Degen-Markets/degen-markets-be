DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "winTimestamp" NUMERIC(20);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "winTimestamp" already exists in bets.';
    END
$$;

CREATE INDEX IF NOT EXISTS "idx_winTimestamp" ON bets("winTimestamp");