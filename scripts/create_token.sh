# 1. Creating token with token-2022 (metadata enabled)
spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb create-token --enable-metadata

# 2. Initialise metadata
spl-token initialize-metadata <OUTPUT> BetAi BETAI https://degenmarkets.com/betai.json

# 3. Initialize token account
spl-token create-account <OUTPUT>

# 4. Mint 1 billion tokens
spl-token mint <OUTPUT> 1000000000

# 5. Disable additional minting (Remove mint authority)
spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb authorize <OUTPUT> mint --disable

# 6. Get Mint Account Details
spl-token --program-id TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb account-info <OUTPUT>
