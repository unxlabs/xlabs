-- ============================================================
-- Unlimited X Labs
-- Migration 0001: Identity System
-- ============================================================


-- ============================================================
-- USERS
-- The permanent identity of a member inside Unlimited X Labs.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,

    username TEXT,

    referral_code TEXT NOT NULL UNIQUE,
    referred_by_user_id TEXT,

    country TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'suspended', 'banned')),

    created_at INTEGER NOT NULL,
    last_active_at INTEGER NOT NULL,

    FOREIGN KEY (referred_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- WALLETS
-- Wallets connected to an Unlimited X Labs identity.
-- ============================================================

CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    address TEXT NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 56,

    is_primary INTEGER NOT NULL DEFAULT 0
        CHECK (is_primary IN (0, 1)),

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disconnected', 'blocked')),

    connected_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE(address, chain_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_referral_code
ON users(referral_code);

CREATE INDEX IF NOT EXISTS idx_users_referred_by
ON users(referred_by_user_id);

CREATE INDEX IF NOT EXISTS idx_users_last_active
ON users(last_active_at);

CREATE INDEX IF NOT EXISTS idx_wallets_user
ON wallets(user_id);

CREATE INDEX IF NOT EXISTS idx_wallets_address
ON wallets(address);

CREATE INDEX IF NOT EXISTS idx_wallets_user_primary
ON wallets(user_id, is_primary);