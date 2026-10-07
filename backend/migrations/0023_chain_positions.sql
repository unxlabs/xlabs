-- Unlimited X Labs
-- Migration 0023: On-chain Position Materialization V2
PRAGMA foreign_keys = ON;

CREATE TABLE chain_position_scan_state (
  chain_id INTEGER NOT NULL,
  contract_key TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  next_position_id INTEGER NOT NULL DEFAULT 1,
  last_scan_at INTEGER,
  last_success_at INTEGER,
  last_error TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (chain_id, contract_key)
);

CREATE TABLE chain_positions (
  id TEXT PRIMARY KEY NOT NULL,
  chain_id INTEGER NOT NULL,
  product_type TEXT NOT NULL CHECK(product_type IN ('earn','stake')),
  contract_key TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  position_id INTEGER NOT NULL,
  pool_id TEXT,
  user_address TEXT NOT NULL,
  principal_atomic TEXT NOT NULL,
  funded_for_withdrawal_atomic TEXT,
  status INTEGER NOT NULL,
  created_at_chain INTEGER,
  lock_started_at_chain INTEGER,
  lock_ends_at_chain INTEGER,
  withdrawal_requested_at_chain INTEGER,
  funded_at_chain INTEGER,
  claimable_at_chain INTEGER,
  withdrawn_at_chain INTEGER,
  first_seen_at INTEGER NOT NULL,
  last_synced_at INTEGER NOT NULL,
  UNIQUE(chain_id, contract_address, position_id)
);
CREATE INDEX idx_chain_positions_user ON chain_positions(chain_id, user_address, created_at_chain DESC);
CREATE INDEX idx_chain_positions_product ON chain_positions(chain_id, product_type, contract_key, status);
CREATE INDEX idx_chain_positions_contract_position ON chain_positions(chain_id, contract_address, position_id);
