CREATE TABLE IF NOT EXISTS genesis_ownership (
    user_id TEXT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 56,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),

    tier_key TEXT NOT NULL DEFAULT 'none',
    tier_name TEXT NOT NULL DEFAULT 'None',

    xp_boost_percent INTEGER NOT NULL DEFAULT 0
        CHECK (xp_boost_percent >= 0),

    referral_boost_percent INTEGER NOT NULL DEFAULT 0
        CHECK (referral_boost_percent >= 0),

    synced_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_genesis_ownership_wallet
ON genesis_ownership(wallet_address);

CREATE INDEX IF NOT EXISTS idx_genesis_ownership_balance
ON genesis_ownership(balance);

CREATE INDEX IF NOT EXISTS idx_genesis_ownership_tier
ON genesis_ownership(tier_key);

CREATE INDEX IF NOT EXISTS idx_genesis_ownership_synced
ON genesis_ownership(synced_at);
