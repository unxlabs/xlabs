-- ============================================================
-- Unlimited X Labs
-- Migration 0007: Season Core
-- ============================================================
--
-- Purpose:
-- 1. Define X Labs seasons.
-- 2. Track user participation in each season.
-- 3. Maintain fast seasonal XP balances.
--
-- XP transactions remain the historical source of truth.
-- season_participants stores the fast current season state
-- used by dashboards, progression and future leaderboards.
-- ============================================================


-- ============================================================
-- SEASONS
-- Defines every season inside Unlimited X Labs.
-- ============================================================

CREATE TABLE IF NOT EXISTS seasons (
    id TEXT PRIMARY KEY,

    -- Internal unique identifier suitable for URLs and APIs.
    -- Example: season-1-genesis-growth
    slug TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    description TEXT,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'active',
                'ended',
                'archived'
            )
        ),

    -- At most one season may be marked as current.
    is_current INTEGER NOT NULL DEFAULT 0
        CHECK (is_current IN (0, 1)),

    starts_at INTEGER,

    ends_at INTEGER,

    created_at INTEGER NOT NULL,

    updated_at INTEGER NOT NULL,

    CHECK (
        ends_at IS NULL
        OR starts_at IS NULL
        OR ends_at > starts_at
    )
);


-- ============================================================
-- SEASON PARTICIPANTS
-- One record per user per season.
--
-- This represents the user's current state inside a season.
-- Historical XP activity remains stored in xp_transactions.
-- ============================================================

CREATE TABLE IF NOT EXISTS season_participants (
    id TEXT PRIMARY KEY,

    season_id TEXT NOT NULL,

    user_id TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'completed',
                'disqualified'
            )
        ),

    -- Fast seasonal XP balance.
    -- Updated whenever season-linked XP is awarded/reversed.
    season_xp INTEGER NOT NULL DEFAULT 0
        CHECK (season_xp >= 0),

    joined_at INTEGER NOT NULL,

    last_active_at INTEGER NOT NULL,

    updated_at INTEGER NOT NULL,

    FOREIGN KEY (season_id)
        REFERENCES seasons(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- A user may participate only once in the same season.
    UNIQUE(season_id, user_id)
);


-- ============================================================
-- INDEXES: SEASONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_seasons_status
ON seasons(status);

CREATE INDEX IF NOT EXISTS idx_seasons_start
ON seasons(starts_at);

CREATE INDEX IF NOT EXISTS idx_seasons_end
ON seasons(ends_at);

-- Database-level protection:
-- only one row may have is_current = 1.
CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_single_current
ON seasons(is_current)
WHERE is_current = 1;


-- ============================================================
-- INDEXES: SEASON PARTICIPANTS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_season_participants_season
ON season_participants(season_id);

CREATE INDEX IF NOT EXISTS idx_season_participants_user
ON season_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_season_participants_status
ON season_participants(season_id, status);

-- Prepared for fast season leaderboards.
CREATE INDEX IF NOT EXISTS idx_season_participants_leaderboard
ON season_participants(season_id, season_xp DESC);

-- Useful for activity and retention analytics.
CREATE INDEX IF NOT EXISTS idx_season_participants_activity
ON season_participants(season_id, last_active_at DESC);


-- ============================================================
-- XP / SEASON RELATION
-- ============================================================
--
-- xp_transactions.season_id was intentionally introduced
-- in Migration 0006 before the seasons table existed.
--
-- SQLite does not support adding a foreign-key constraint to an
-- existing column without rebuilding the table.
--
-- We intentionally do NOT rebuild xp_transactions here.
--
-- The backend Season + XP Engine will validate season_id before
-- awarding season XP.
--
-- This preserves the existing immutable XP ledger and avoids
-- unnecessary migration risk.
-- ============================================================