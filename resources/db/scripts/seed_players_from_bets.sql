-- Insert creators into players table if they don't already exist
INSERT INTO players (address)
SELECT DISTINCT LOWER(creator) AS address
FROM bets
WHERE chain = 'base'
ON CONFLICT (address) DO NOTHING;

-- Insert acceptors into players table if they don't already exist
INSERT INTO players (address)
SELECT DISTINCT LOWER(acceptor) AS address
FROM bets
WHERE acceptor IS NOT NULL AND chain = 'base'
ON CONFLICT (address) DO NOTHING;
