-- Unlimited X Labs
-- Migration 0012: Trusted Activity Ledger
-- Stores normalized backend/on-chain/admin verified product events.
-- It is NOT a frontend click analytics table and must not accept client claims as trusted proof.

PRAGMA foreign_keys = ON;

CREATE TABLE trusted_activity_events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  season_id TEXT,
  event_type TEXT NOT NULL,
  source_type TEXT NOT NULL
    CHECK (source_type IN (
      'mission',
      'referral',
      'genesis',
      'onchain',
      'campaign',
      'admin',
      'system'
    )),
  source_id TEXT,
  trust_level TEXT NOT NULL
    CHECK (trust_level IN ('backend', 'onchain', 'admin', 'system')),
  occurred_at INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  evidence TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL
);

CREATE INDEX idx_trusted_activity_user_time
  ON trusted_activity_events(user_id, occurred_at DESC);

CREATE INDEX idx_trusted_activity_season_time
  ON trusted_activity_events(season_id, occurred_at DESC);

CREATE INDEX idx_trusted_activity_type_time
  ON trusted_activity_events(event_type, occurred_at DESC);

CREATE INDEX idx_trusted_activity_source
  ON trusted_activity_events(source_type, source_id);
