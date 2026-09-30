-- Unlimited X Labs
-- Migration 0014: Leaderboard Foundation
-- Current Season rank is derived from season_participants.season_xp.
-- This migration adds deterministic tie support and durable published/final snapshots only.
-- It intentionally does NOT mirror every live rank into another mutable table.

PRAGMA foreign_keys = ON;

-- Improves deterministic live ranking:
-- higher XP first; earlier join then stable user id break ties.
CREATE INDEX IF NOT EXISTS idx_season_participants_rank_stable
  ON season_participants(season_id, status, season_xp DESC, joined_at ASC, user_id ASC);

CREATE TABLE leaderboard_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  leaderboard_type TEXT NOT NULL
    CHECK (leaderboard_type IN ('season','weekly','referral','campaign')),
  season_id TEXT,
  campaign_id TEXT,
  period_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','final')),
  generated_at INTEGER NOT NULL,
  published_at INTEGER,
  finalized_at INTEGER,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  CHECK (status <> 'published' OR published_at IS NOT NULL),
  CHECK (status <> 'final' OR finalized_at IS NOT NULL),
  CHECK (
    (leaderboard_type IN ('season','weekly','referral') AND season_id IS NOT NULL AND campaign_id IS NULL)
    OR
    (leaderboard_type = 'campaign' AND campaign_id IS NOT NULL)
  )
);

-- SQLite UNIQUE treats NULL values as distinct, so snapshot uniqueness
-- is enforced with scope-specific partial indexes.
CREATE UNIQUE INDEX idx_leaderboard_snapshots_season_unique
  ON leaderboard_snapshots(leaderboard_type, season_id, period_key)
  WHERE campaign_id IS NULL;

CREATE UNIQUE INDEX idx_leaderboard_snapshots_campaign_unique
  ON leaderboard_snapshots(campaign_id, period_key)
  WHERE leaderboard_type = 'campaign';

CREATE INDEX idx_leaderboard_snapshots_lookup
  ON leaderboard_snapshots(leaderboard_type, season_id, period_key, status);

CREATE INDEX idx_leaderboard_snapshots_campaign_lookup
  ON leaderboard_snapshots(campaign_id, period_key, status)
  WHERE campaign_id IS NOT NULL;

CREATE TABLE leaderboard_snapshot_entries (
  snapshot_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank > 0),
  score INTEGER NOT NULL,
  tie_break_value TEXT,
  metadata TEXT,
  PRIMARY KEY (snapshot_id, user_id),
  FOREIGN KEY (snapshot_id) REFERENCES leaderboard_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (snapshot_id, rank)
);

CREATE INDEX idx_leaderboard_entries_rank
  ON leaderboard_snapshot_entries(snapshot_id, rank);

CREATE INDEX idx_leaderboard_entries_user
  ON leaderboard_snapshot_entries(user_id, snapshot_id);
