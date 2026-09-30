-- ============================================================
-- Unlimited X Labs
-- Migration 0008: Mission Engine
-- ============================================================
--
-- Purpose:
-- 1. Define backend-managed missions.
-- 2. Connect missions to seasons.
-- 3. Support one-time and repeatable missions.
-- 4. Track user mission progress and verified completions.
-- 5. Prepare missions for XP Engine integration.
--
-- XP remains owned by the XP Engine.
-- Mission tables track mission state, progress and completion.
-- xp_transactions remains the historical XP ledger.
-- ============================================================


-- ============================================================
-- MISSIONS
-- Defines every mission available inside Unlimited X Labs.
-- ============================================================

CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,

    -- Optional season relationship.
    -- NULL allows future global/non-seasonal missions.
    season_id TEXT,

    -- Stable identifier suitable for APIs and admin tools.
    -- Example: explore-genesis-pass
    slug TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    description TEXT,

    -- Used for product organization and future UI sections.
    category TEXT NOT NULL
        CHECK (
            category IN (
                'explore',
                'engage',
                'spread',
                'invite',
                'build'
            )
        ),

    -- Determines how completion must be verified.
    verification_type TEXT NOT NULL
        CHECK (
            verification_type IN (
                'instant',
                'onchain',
                'referral',
                'social',
                'manual',
                'system'
            )
        ),

    -- Base XP before Genesis or future XP boosts.
    base_xp INTEGER NOT NULL DEFAULT 0
        CHECK (base_xp >= 0),

    -- Controls whether the mission can currently be used.
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'active',
                'paused',
                'ended',
                'archived'
            )
        ),

    -- Determines how often the mission may be completed.
    repeat_type TEXT NOT NULL DEFAULT 'once'
        CHECK (
            repeat_type IN (
                'once',
                'daily',
                'weekly',
                'repeatable'
            )
        ),

    -- Maximum lifetime completions per user.
    --
    -- NULL means the repeat rule determines availability
    -- without a lifetime completion cap.
    --
    -- For repeat_type = 'once', this should normally be 1.
    max_completions INTEGER
        CHECK (
            max_completions IS NULL
            OR max_completions > 0
        ),

    -- Optional JSON configuration interpreted by the backend.
    --
    -- Examples:
    -- onchain contract/token requirements,
    -- system event requirements,
    -- referral qualification requirements.
    verification_config TEXT,

    -- Controls ordering in mission lists.
    sort_order INTEGER NOT NULL DEFAULT 0,

    starts_at INTEGER,

    ends_at INTEGER,

    created_at INTEGER NOT NULL,

    updated_at INTEGER NOT NULL,

    FOREIGN KEY (season_id)
        REFERENCES seasons(id)
        ON DELETE CASCADE,

    CHECK (
        ends_at IS NULL
        OR starts_at IS NULL
        OR ends_at > starts_at
    ),

    CHECK (
        repeat_type != 'once'
        OR max_completions IS NULL
        OR max_completions = 1
    )
);


-- ============================================================
-- USER MISSION PROGRESS
-- One state record per user per mission.
--
-- This table is optimized for the application/dashboard.
-- Individual verified completions are stored separately below.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_mission_progress (
    id TEXT PRIMARY KEY,

    mission_id TEXT NOT NULL,

    user_id TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'available'
        CHECK (
            status IN (
                'available',
                'in_progress',
                'completed',
                'blocked'
            )
        ),

    -- Generic progress counters.
    -- Example: 2 qualified referrals out of a target of 5.
    progress_value INTEGER NOT NULL DEFAULT 0
        CHECK (progress_value >= 0),

    target_value INTEGER NOT NULL DEFAULT 1
        CHECK (target_value > 0),

    -- Number of verified mission completions.
    completion_count INTEGER NOT NULL DEFAULT 0
        CHECK (completion_count >= 0),

    first_started_at INTEGER,

    last_progress_at INTEGER,

    last_completed_at INTEGER,

    created_at INTEGER NOT NULL,

    updated_at INTEGER NOT NULL,

    FOREIGN KEY (mission_id)
        REFERENCES missions(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE(mission_id, user_id)
);


-- ============================================================
-- MISSION COMPLETIONS
-- Immutable-style record of verified mission completions.
--
-- One row represents one successful completion period/event.
-- The XP Engine will use these records to award mission XP.
-- ============================================================

CREATE TABLE IF NOT EXISTS mission_completions (
    id TEXT PRIMARY KEY,

    mission_id TEXT NOT NULL,

    user_id TEXT NOT NULL,

    season_id TEXT,

    -- Identifies the repeat window/event.
    --
    -- Examples:
    -- once:
    --   once
    --
    -- daily:
    --   2026-09-30
    --
    -- weekly:
    --   2026-W40
    --
    -- repeatable:
    --   backend-generated event identifier
    --
    -- Together with mission_id + user_id this prevents
    -- duplicate rewards for the same completion period.
    period_key TEXT NOT NULL,

    -- Snapshot of the mission base XP at completion time.
    -- Historical completions therefore remain auditable if an
    -- admin changes the mission XP later.
    base_xp INTEGER NOT NULL
        CHECK (base_xp >= 0),

    status TEXT NOT NULL DEFAULT 'verified'
        CHECK (
            status IN (
                'verified',
                'rewarded',
                'rejected',
                'reversed'
            )
        ),

    -- Optional reference to the resulting XP transaction.
    -- Kept as TEXT without a foreign key to avoid coupling the
    -- mission state machine to XP ledger migration constraints.
    xp_transaction_id TEXT,

    -- Optional backend/admin verification evidence.
    -- JSON/text metadata only; never trust client evidence alone.
    verification_data TEXT,

    verified_at INTEGER NOT NULL,

    rewarded_at INTEGER,

    reversed_at INTEGER,

    created_at INTEGER NOT NULL,

    updated_at INTEGER NOT NULL,

    FOREIGN KEY (mission_id)
        REFERENCES missions(id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (season_id)
        REFERENCES seasons(id)
        ON DELETE SET NULL,

    -- Core idempotency protection.
    UNIQUE(mission_id, user_id, period_key)
);


-- ============================================================
-- INDEXES: MISSIONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_missions_season
ON missions(season_id);

CREATE INDEX IF NOT EXISTS idx_missions_status
ON missions(status);

CREATE INDEX IF NOT EXISTS idx_missions_season_status
ON missions(season_id, status);

CREATE INDEX IF NOT EXISTS idx_missions_category
ON missions(category);

CREATE INDEX IF NOT EXISTS idx_missions_verification
ON missions(verification_type);

CREATE INDEX IF NOT EXISTS idx_missions_schedule
ON missions(starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_missions_display
ON missions(season_id, status, sort_order);


-- ============================================================
-- INDEXES: USER MISSION PROGRESS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user
ON user_mission_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_user_mission_progress_mission
ON user_mission_progress(mission_id);

CREATE INDEX IF NOT EXISTS idx_user_mission_progress_user_status
ON user_mission_progress(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_mission_progress_mission_status
ON user_mission_progress(mission_id, status);


-- ============================================================
-- INDEXES: MISSION COMPLETIONS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_mission_completions_user
ON mission_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_mission_completions_mission
ON mission_completions(mission_id);

CREATE INDEX IF NOT EXISTS idx_mission_completions_season
ON mission_completions(season_id);

CREATE INDEX IF NOT EXISTS idx_mission_completions_status
ON mission_completions(status);

CREATE INDEX IF NOT EXISTS idx_mission_completions_user_created
ON mission_completions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mission_completions_mission_created
ON mission_completions(mission_id, created_at DESC);


-- ============================================================
-- MISSION / XP RELATION
-- ============================================================
--
-- Mission completion does NOT directly modify XP balances.
--
-- The backend Mission Engine will:
--
-- 1. Validate the authenticated user.
-- 2. Validate the mission.
-- 3. Validate the season and active participation when required.
-- 4. Verify the mission according to verification_type.
-- 5. Generate the correct period_key.
-- 6. Create/find the mission completion idempotently.
-- 7. Call the existing XP Engine with:
--
--      source_type = 'mission'
--      source_id   = mission.id
--      season_id   = mission.season_id
--
-- 8. Apply Genesis XP boost through the existing XP Engine.
-- 9. Link the resulting XP transaction to the completion.
--
-- Client requests alone must never be treated as proof that a
-- mission was successfully completed.
-- ============================================================