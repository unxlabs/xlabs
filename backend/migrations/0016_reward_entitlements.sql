-- Unlimited X Labs
-- Migration 0016: Reward Entitlements
-- Separates earning/eligibility from delivery/claim.
-- XP is intentionally excluded: XP continues to use the XP Engine.

PRAGMA foreign_keys = ON;

CREATE TABLE reward_programs (
  id TEXT PRIMARY KEY NOT NULL,
  season_id TEXT,
  campaign_id TEXT,
  eligibility_program_id TEXT,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  reward_type TEXT NOT NULL
    CHECK (reward_type IN ('token','stablecoin','nft','badge','partner','other')),
  asset_chain_id INTEGER,
  asset_address TEXT,
  asset_symbol TEXT,
  distribution_mode TEXT NOT NULL
    CHECK (distribution_mode IN ('claim','push','manual','offchain')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','funding','claimable','ended','archived')),
  starts_at INTEGER,
  ends_at INTEGER,
  config TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (eligibility_program_id) REFERENCES eligibility_programs(id) ON DELETE SET NULL,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_reward_programs_scope
  ON reward_programs(season_id, campaign_id, status);

CREATE TABLE reward_entitlements (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  eligibility_evaluation_id TEXT,
  amount_atomic TEXT,
  token_id TEXT,
  metadata TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','claimable','processing','claimed','cancelled')),
  earned_at INTEGER NOT NULL,
  approved_at INTEGER,
  claimable_at INTEGER,
  claimed_at INTEGER,
  cancelled_at INTEGER,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES reward_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (eligibility_evaluation_id) REFERENCES eligibility_evaluations(id) ON DELETE SET NULL,
  CHECK (status <> 'approved' OR approved_at IS NOT NULL),
  CHECK (status <> 'claimable' OR claimable_at IS NOT NULL),
  CHECK (status <> 'claimed' OR claimed_at IS NOT NULL),
  CHECK (status <> 'cancelled' OR cancelled_at IS NOT NULL)
);

CREATE INDEX idx_reward_entitlements_user
  ON reward_entitlements(user_id, status, earned_at DESC);

CREATE INDEX idx_reward_entitlements_program
  ON reward_entitlements(program_id, status, earned_at DESC);

CREATE TABLE reward_delivery_attempts (
  id TEXT PRIMARY KEY NOT NULL,
  entitlement_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  status TEXT NOT NULL
    CHECK (status IN ('started','submitted','confirmed','failed')),
  tx_hash TEXT,
  error_code TEXT,
  error_message TEXT,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER,
  confirmed_at INTEGER,
  failed_at INTEGER,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (entitlement_id) REFERENCES reward_entitlements(id) ON DELETE CASCADE,
  UNIQUE (entitlement_id, attempt_number),
  CHECK (status <> 'submitted' OR submitted_at IS NOT NULL),
  CHECK (status <> 'confirmed' OR confirmed_at IS NOT NULL),
  CHECK (status <> 'failed' OR failed_at IS NOT NULL)
);

CREATE INDEX idx_reward_delivery_entitlement
  ON reward_delivery_attempts(entitlement_id, attempt_number DESC);

CREATE INDEX idx_reward_delivery_tx
  ON reward_delivery_attempts(tx_hash)
  WHERE tx_hash IS NOT NULL;
