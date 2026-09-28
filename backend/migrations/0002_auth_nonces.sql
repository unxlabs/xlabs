-- ============================================================
-- Unlimited X Labs
-- Migration 0002: Wallet Authentication Nonces
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_nonces (
    id TEXT PRIMARY KEY,

    wallet_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 56,

    nonce TEXT NOT NULL UNIQUE,
    message TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'used', 'expired')),

    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet
ON auth_nonces(wallet_address, chain_id);

CREATE INDEX IF NOT EXISTS idx_auth_nonces_nonce
ON auth_nonces(nonce);

CREATE INDEX IF NOT EXISTS idx_auth_nonces_status
ON auth_nonces(status);

CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires
ON auth_nonces(expires_at);