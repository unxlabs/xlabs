-- Unlimited X Labs
-- Migration 0010: Progression + Achievements
-- Purpose:
--   Turn XP into visible, motivating progress without duplicating the XP ledger.
--   Levels/milestones are definitions; unlocks are durable user history.
--   Achievements are broader badges triggered by trusted platform activity.
--
-- Design:
--   - XP remains the source of truth in xp_transactions / xp_balances.
--   - This migration does not store a second mutable "total XP".
--   - Definitions are data-driven so Admin can change future progression without frontend releases.
--   - User unlock rows are durable historical facts; revocation is explicit, never silent.
--   - Global and seasonal achievement uniqueness are enforced separately because SQLite
--     UNIQUE constraints allow multiple NULL values.

PRAGMA foreign_keys = ON;

CREATE TABLE progression_levels (
  id TEXT PRIMARY KEY NOT NULL,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  min_lifetime_xp INTEGER NOT NULL CHECK (min_lifetime_xp >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  icon_key TEXT,
  visual_config TEXT,
  benefits_config TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_progression_levels_active_threshold
  ON progression_levels(min_lifetime_xp)
  WHERE status = 'active';

CREATE INDEX idx_progression_levels_status_sort
  ON progression_levels(status, sort_order, min_lifetime_xp);

CREATE TABLE progression_milestones (
  id TEXT PRIMARY KEY NOT NULL,
  season_id TEXT,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT NOT NULL
    CHECK (metric_type IN (
      'lifetime_xp',
      'season_xp',
      'missions_completed',
      'qualified_referrals',
      'genesis_balance',
      'campaigns_completed',
      'custom'
    )),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  requirements_config TEXT,
  reward_config TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

-- SQLite treats NULLs as distinct in UNIQUE constraints, so global and seasonal
-- milestone keys need separate partial indexes.
CREATE UNIQUE INDEX idx_progression_milestones_global_key
  ON progression_milestones(key)
  WHERE season_id IS NULL;

CREATE UNIQUE INDEX idx_progression_milestones_season_key
  ON progression_milestones(season_id, key)
  WHERE season_id IS NOT NULL;

CREATE INDEX idx_progression_milestones_season_status
  ON progression_milestones(season_id, status, sort_order);

CREATE TABLE user_milestone_unlocks (
  id TEXT PRIMARY KEY NOT NULL,
  milestone_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  season_id TEXT,
  achieved_value INTEGER NOT NULL CHECK (achieved_value >= 0),
  status TEXT NOT NULL DEFAULT 'unlocked'
    CHECK (status IN ('unlocked', 'revoked')),
  source_type TEXT NOT NULL,
  source_id TEXT,
  evidence TEXT,
  unlocked_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (milestone_id) REFERENCES progression_milestones(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  UNIQUE (milestone_id, user_id),
  CHECK (
    (status = 'unlocked' AND revoked_at IS NULL)
    OR
    (status = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE INDEX idx_user_milestone_unlocks_user
  ON user_milestone_unlocks(user_id, unlocked_at DESC);

CREATE INDEX idx_user_milestone_unlocks_season
  ON user_milestone_unlocks(season_id, unlocked_at DESC);

CREATE TABLE achievements (
  id TEXT PRIMARY KEY NOT NULL,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL
    CHECK (category IN (
      'explore',
      'engage',
      'spread',
      'invite',
      'build',
      'genesis',
      'season',
      'special'
    )),
  rarity TEXT NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  criteria_type TEXT NOT NULL,
  criteria_config TEXT NOT NULL,
  icon_key TEXT,
  visual_config TEXT,
  share_config TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'hidden', 'archived')),
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_achievements_status_category
  ON achievements(status, category);

CREATE TABLE user_achievements (
  id TEXT PRIMARY KEY NOT NULL,
  achievement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  season_id TEXT,
  status TEXT NOT NULL DEFAULT 'earned'
    CHECK (status IN ('earned', 'revoked')),
  source_type TEXT NOT NULL,
  source_id TEXT,
  evidence TEXT,
  earned_at INTEGER NOT NULL,
  revoked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  CHECK (
    (status = 'earned' AND revoked_at IS NULL)
    OR
    (status = 'revoked' AND revoked_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_user_achievements_global_unique
  ON user_achievements(achievement_id, user_id)
  WHERE season_id IS NULL;

CREATE UNIQUE INDEX idx_user_achievements_season_unique
  ON user_achievements(achievement_id, user_id, season_id)
  WHERE season_id IS NOT NULL;

CREATE INDEX idx_user_achievements_user
  ON user_achievements(user_id, earned_at DESC);

CREATE INDEX idx_user_achievements_season
  ON user_achievements(season_id, earned_at DESC);

-- Streaks are generic: daily login, daily mission, or another trusted event
-- can own a streak without creating a new table for every feature.
CREATE TABLE user_streaks (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  streak_type TEXT NOT NULL,
  current_count INTEGER NOT NULL DEFAULT 0 CHECK (current_count >= 0),
  best_count INTEGER NOT NULL DEFAULT 0 CHECK (best_count >= 0),
  last_period_key TEXT,
  last_qualified_at INTEGER,
  freeze_count INTEGER NOT NULL DEFAULT 0 CHECK (freeze_count >= 0),
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (user_id, streak_type),
  CHECK (best_count >= current_count)
);

CREATE INDEX idx_user_streaks_type
  ON user_streaks(streak_type, current_count DESC);
