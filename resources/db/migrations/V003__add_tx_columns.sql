DO $$
    BEGIN
        ALTER TABLE bets ADD COLUMN "paidTx" VARCHAR(66);
    EXCEPTION
        WHEN duplicate_column THEN RAISE NOTICE 'Column "paidTx" already exists in bets.';
    END
$$;