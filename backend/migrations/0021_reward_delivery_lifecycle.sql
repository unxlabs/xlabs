-- Unlimited X Labs
-- Migration 0021: Reward Delivery Lifecycle & Reconciliation
-- Extends the immutable 0016/0020 reward schema. Do not edit historical migrations.

PRAGMA foreign_keys = ON;

-- Operational reconciliation is intentionally separate from reward_events.
-- It records whether an internal delivery matches the external/off-chain/on-chain evidence.
CREATE TABLE reward_reconciliations (
  id TEXT PRIMARY KEY NOT NULL,
  batch_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  entitlement_id TEXT NOT NULL,
  attempt_id TEXT,
  outcome TEXT NOT NULL
    CHECK (outcome IN ('matched','mismatch','needs_review')),
  external_reference TEXT,
  note TEXT,
  metadata TEXT,
  reconciled_by_user_id TEXT NOT NULL,
  reconciled_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (batch_id) REFERENCES reward_distribution_batches(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES reward_distribution_items(id) ON DELETE CASCADE,
  FOREIGN KEY (entitlement_id) REFERENCES reward_entitlements(id) ON DELETE CASCADE,
  FOREIGN KEY (attempt_id) REFERENCES reward_delivery_attempts(id) ON DELETE SET NULL,
  FOREIGN KEY (reconciled_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_reward_reconciliations_item
  ON reward_reconciliations(item_id, reconciled_at DESC);

CREATE INDEX idx_reward_reconciliations_batch
  ON reward_reconciliations(batch_id, outcome, reconciled_at DESC);

-- Corrections never silently rewrite historical entitlements or confirmed deliveries.
-- They are an auditable instruction. Financial remediation is fulfilled through a
-- separate entitlement/distribution when required.
CREATE TABLE reward_corrections (
  id TEXT PRIMARY KEY NOT NULL,
  entitlement_id TEXT NOT NULL,
  item_id TEXT,
  correction_type TEXT NOT NULL
    CHECK (correction_type IN ('credit','debit','void','metadata')),
  amount_atomic TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'recorded'
    CHECK (status IN ('recorded','resolved','cancelled')),
  resolution_reference TEXT,
  metadata TEXT,
  created_by_user_id TEXT NOT NULL,
  resolved_by_user_id TEXT,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (entitlement_id) REFERENCES reward_entitlements(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES reward_distribution_items(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CHECK (correction_type = 'metadata' OR amount_atomic IS NOT NULL),
  CHECK (status <> 'resolved' OR (resolved_at IS NOT NULL AND resolved_by_user_id IS NOT NULL))
);

CREATE INDEX idx_reward_corrections_entitlement
  ON reward_corrections(entitlement_id, status, created_at DESC);
