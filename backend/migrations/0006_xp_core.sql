-- ============================================================
-- Unlimited X Labs
-- Migration 0006: XP Core
-- ============================================================


-- ============================================================
-- XP BALANCES
-- Fast current XP totals for each user.
--
-- The transaction ledger remains the source of truth.
-- This table exists so dashboards and leaderboards do not need
-- to aggregate the entire XP history on every request.
-- ============================================================

CREATE TABLE IF NOT EXISTS xp_balances (
    user_id TEXT PRIMARY KEY,

    lifetime_xp INTEGER NOT NULL DEFAULT 0
        CHECK (lifetime_xp >= 0),

    updated_at INTEGER NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- XP TRANSACTIONS
-- Immutable-style ledger of XP activity.
--
-- Every XP award or reversal must have its own transaction.
-- Never silently overwrite historical XP transactions.
-- ============================================================

CREATE TABLE IF NOT EXISTS xp_transactions (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    -- Reserved for the Seasons system.
    -- Kept as TEXT without a foreign key until the seasons
    -- table is introduced in a future migration.
    season_id TEXT,

    source_type TEXT NOT NULL
        CHECK (
            source_type IN (
                'mission',
                'referral',
                'daily',
                'genesis',
                'admin',
                'campaign',
                'system'
            )
        ),

    -- ID of the mission, referral, campaign, etc.
    -- May be NULL for system/admin transactions.
    source_id TEXT,

    base_xp INTEGER NOT NULL DEFAULT 0
        CHECK (base_xp >= 0),

    boost_xp INTEGER NOT NULL DEFAULT 0
        CHECK (boost_xp >= 0),

    total_xp INTEGER NOT NULL
        CHECK (total_xp >= 0),

    -- Snapshot of the multiplier used when XP was awarded.
    -- 10000 = 1.0000x
    -- 12000 = 1.2000x
    multiplier_bps INTEGER NOT NULL DEFAULT 10000
        CHECK (multiplier_bps >= 0),

    reason TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'reversed')),

    -- Prevents the same reward/action from being granted twice.
    -- Example:
    -- mission:<mission_id>:user:<user_id>
    idempotency_key TEXT NOT NULL UNIQUE,

    created_at INTEGER NOT NULL,

    reversed_at INTEGER,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user
ON xp_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_status
ON xp_transactions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_created
ON xp_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_source
ON xp_transactions(source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_season
ON xp_transactions(season_id);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_created
ON xp_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_xp_balances_lifetime
ON xp_balances(lifetime_xp DESC);