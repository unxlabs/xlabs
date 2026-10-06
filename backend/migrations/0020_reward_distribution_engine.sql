-- Unlimited X Labs
-- Migration 0020: Reward Distribution Engine
-- Extends 0016 without changing historical migrations.
-- Eligibility, allocation, entitlement and delivery remain separate stages.

PRAGMA foreign_keys = ON;

-- Immutable/frozen calculation context for a reward program.
CREATE TABLE reward_snapshots (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  eligibility_program_id TEXT,
  snapshot_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','calculating','review','frozen','cancelled')),
  formula_version INTEGER NOT NULL DEFAULT 1 CHECK (formula_version > 0),
  formula_config TEXT NOT NULL,
  source_summary TEXT,
  participant_count INTEGER NOT NULL DEFAULT 0 CHECK (participant_count >= 0),
  eligible_count INTEGER NOT NULL DEFAULT 0 CHECK (eligible_count >= 0),
  total_weight TEXT,
  budget_atomic TEXT,
  calculated_at INTEGER,
  frozen_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES reward_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (eligibility_program_id) REFERENCES eligibility_programs(id) ON DELETE SET NULL,
  UNIQUE (program_id, snapshot_key),
  CHECK (status <> 'frozen' OR frozen_at IS NOT NULL)
);

CREATE INDEX idx_reward_snapshots_program
  ON reward_snapshots(program_id, status, created_at DESC);

-- Per-user evidence captured by the allocation calculation.
-- This table is intentionally separate from reward_entitlements: a calculated
-- allocation is not yet a financial entitlement until it is approved/materialized.
CREATE TABLE reward_allocations (
  id TEXT PRIMARY KEY NOT NULL,
  snapshot_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  eligibility_evaluation_id TEXT,
  status TEXT NOT NULL DEFAULT 'calculated'
    CHECK (status IN ('calculated','review','approved','excluded','materialized','cancelled')),
  score TEXT,
  weight TEXT,
  amount_atomic TEXT,
  tier_key TEXT,
  reason TEXT,
  evidence TEXT,
  approved_at INTEGER,
  materialized_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (snapshot_id) REFERENCES reward_snapshots(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (eligibility_evaluation_id) REFERENCES eligibility_evaluations(id) ON DELETE SET NULL,
  UNIQUE (snapshot_id, user_id),
  CHECK (status <> 'approved' OR approved_at IS NOT NULL),
  CHECK (status <> 'materialized' OR materialized_at IS NOT NULL)
);

CREATE INDEX idx_reward_allocations_snapshot
  ON reward_allocations(snapshot_id, status, user_id);

CREATE INDEX idx_reward_allocations_user
  ON reward_allocations(user_id, created_at DESC);

-- A distribution batch is the operational boundary for claim/push/manual delivery.
-- It can later hold a Merkle root for contract-based claims without requiring
-- the token or distributor contract to exist today.
CREATE TABLE reward_distribution_batches (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  snapshot_id TEXT,
  batch_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','funding','ready','live','paused','completed','cancelled')),
  distribution_mode TEXT NOT NULL
    CHECK (distribution_mode IN ('claim','push','manual','offchain')),
  chain_id INTEGER,
  asset_address TEXT,
  asset_symbol TEXT,
  total_amount_atomic TEXT,
  entitlement_count INTEGER NOT NULL DEFAULT 0 CHECK (entitlement_count >= 0),
  merkle_root TEXT,
  distributor_address TEXT,
  funding_tx_hash TEXT,
  starts_at INTEGER,
  ends_at INTEGER,
  funded_at INTEGER,
  activated_at INTEGER,
  completed_at INTEGER,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES reward_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (snapshot_id) REFERENCES reward_snapshots(id) ON DELETE SET NULL,
  UNIQUE (program_id, batch_key),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CHECK (status <> 'live' OR activated_at IS NOT NULL),
  CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);

CREATE INDEX idx_reward_distribution_batches_program
  ON reward_distribution_batches(program_id, status, created_at DESC);

-- Connects an entitlement to exactly one operational batch at a time.
-- claim_index/proof support a future Merkle distributor; push/manual modes may
-- leave them NULL.
CREATE TABLE reward_distribution_items (
  id TEXT PRIMARY KEY NOT NULL,
  batch_id TEXT NOT NULL,
  entitlement_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  wallet_address TEXT,
  amount_atomic TEXT,
  token_id TEXT,
  claim_index INTEGER,
  claim_proof TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','ready','processing','delivered','failed','cancelled')),
  delivered_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES reward_distribution_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (entitlement_id) REFERENCES reward_entitlements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (batch_id, entitlement_id),
  UNIQUE (entitlement_id),
  CHECK (status <> 'delivered' OR delivered_at IS NOT NULL)
);

CREATE INDEX idx_reward_distribution_items_batch
  ON reward_distribution_items(batch_id, status, user_id);

CREATE INDEX idx_reward_distribution_items_user
  ON reward_distribution_items(user_id, status, created_at DESC);

-- Append-only lifecycle ledger. This gives user-facing history and later admin
-- reconciliation a stable source without mutating the meaning of an entitlement.
CREATE TABLE reward_events (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  entitlement_id TEXT,
  batch_id TEXT,
  user_id TEXT,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'snapshot_created','snapshot_frozen','allocation_calculated',
      'allocation_approved','allocation_excluded','entitlement_created',
      'entitlement_approved','entitlement_claimable','delivery_started',
      'delivery_submitted','delivery_confirmed','delivery_failed',
      'entitlement_cancelled','batch_activated','batch_completed'
    )),
  actor_type TEXT NOT NULL
    CHECK (actor_type IN ('system','admin','user','onchain')),
  actor_user_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata TEXT,
  occurred_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES reward_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (entitlement_id) REFERENCES reward_entitlements(id) ON DELETE SET NULL,
  FOREIGN KEY (batch_id) REFERENCES reward_distribution_batches(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reward_events_program
  ON reward_events(program_id, occurred_at DESC);

CREATE INDEX idx_reward_events_user
  ON reward_events(user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_reward_events_entitlement
  ON reward_events(entitlement_id, occurred_at DESC)
  WHERE entitlement_id IS NOT NULL;
