-- Unlimited X Labs
-- Migration 0009: Referral Quality Engine
--
-- Referral lifecycle:
-- joined -> activated -> engaged -> qualified
--
-- Design rules:
-- - One referred user can belong to only one referrer.
-- - Self-referrals are rejected.
-- - Referral relationships are permanent at the database layer.
-- - Stage history is append-only and idempotent.
-- - XP is NOT stored here. Referral XP must go through the central XP Engine.
-- - users.referred_by_user_id remains the identity-level shortcut; referral_relationships
--   is the authoritative referral lifecycle record.

PRAGMA foreign_keys = ON;

CREATE TABLE referral_relationships (
  id TEXT PRIMARY KEY NOT NULL,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'joined'
    CHECK (status IN ('joined', 'activated', 'engaged', 'qualified', 'blocked')),
  joined_at INTEGER NOT NULL,
  activated_at INTEGER,
  engaged_at INTEGER,
  qualified_at INTEGER,
  blocked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,

  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE RESTRICT,

  CHECK (referrer_user_id <> referred_user_id),
  CHECK (activated_at IS NULL OR activated_at >= joined_at),
  CHECK (engaged_at IS NULL OR (activated_at IS NOT NULL AND engaged_at >= activated_at)),
  CHECK (qualified_at IS NULL OR (engaged_at IS NOT NULL AND qualified_at >= engaged_at))
);

CREATE INDEX idx_referral_relationships_referrer
  ON referral_relationships(referrer_user_id);

CREATE INDEX idx_referral_relationships_status
  ON referral_relationships(status);

CREATE INDEX idx_referral_relationships_referrer_status
  ON referral_relationships(referrer_user_id, status);

CREATE INDEX idx_referral_relationships_joined_at
  ON referral_relationships(joined_at);

CREATE TABLE referral_events (
  id TEXT PRIMARY KEY NOT NULL,
  referral_id TEXT NOT NULL,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'joined',
      'activated',
      'engaged',
      'qualified',
      'blocked',
      'xp_awarded'
    )),
  stage TEXT
    CHECK (stage IS NULL OR stage IN ('joined', 'activated', 'engaged', 'qualified', 'blocked')),
  source_type TEXT NOT NULL,
  source_id TEXT,
  season_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata TEXT,
  created_at INTEGER NOT NULL,

  FOREIGN KEY (referral_id) REFERENCES referral_relationships(id) ON DELETE CASCADE,
  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,

  CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX idx_referral_events_referral
  ON referral_events(referral_id, created_at DESC);

CREATE INDEX idx_referral_events_referrer
  ON referral_events(referrer_user_id, created_at DESC);

CREATE INDEX idx_referral_events_referred
  ON referral_events(referred_user_id, created_at DESC);

CREATE INDEX idx_referral_events_type
  ON referral_events(event_type, created_at DESC);

CREATE INDEX idx_referral_events_season
  ON referral_events(season_id, created_at DESC);

-- Keep the existing users.referred_by_user_id field consistent with the
-- authoritative referral relationship. Existing users can still have NULL.
--
-- The backend will set users.referred_by_user_id and insert the matching
-- referral_relationships row together when a referral is accepted.
