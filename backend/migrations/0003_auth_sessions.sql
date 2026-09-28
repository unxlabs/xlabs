-- ============================================================
-- Unlimited X Labs
-- Migration 0003: Authentication Sessions
-- ============================================================


-- ============================================================
-- AUTH SESSIONS
-- Stores authenticated user sessions.
--
-- The raw session token is NEVER stored in the database.
-- Only its SHA-256 hash is stored.
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_sessions (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    token_hash TEXT NOT NULL UNIQUE,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'revoked', 'expired')),

    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,

    revoked_at INTEGER,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash
ON auth_sessions(token_hash);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_status
ON auth_sessions(status);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires
ON auth_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_status
ON auth_sessions(user_id, status);