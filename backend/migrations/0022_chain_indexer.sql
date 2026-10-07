-- Unlimited X Labs
-- Migration 0022: Chain Event Indexer V1
PRAGMA foreign_keys = ON;

CREATE TABLE chain_indexer_state (
  chain_id INTEGER PRIMARY KEY NOT NULL,
  live_cursor_block INTEGER,
  backfill_cursor_block INTEGER,
  latest_finalized_block INTEGER,
  last_run_at INTEGER,
  last_success_at INTEGER,
  last_error TEXT,
  updated_at INTEGER NOT NULL
);

CREATE TABLE chain_events (
  id TEXT PRIMARY KEY NOT NULL,
  chain_id INTEGER NOT NULL,
  contract_key TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  block_hash TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  transaction_index INTEGER,
  log_index INTEGER NOT NULL,
  topic0 TEXT,
  topics TEXT NOT NULL,
  data TEXT NOT NULL,
  event_name TEXT,
  decoded_args TEXT,
  block_timestamp INTEGER,
  observed_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(chain_id, transaction_hash, log_index)
);
CREATE INDEX idx_chain_events_contract_block ON chain_events(chain_id, contract_address, block_number DESC);
CREATE INDEX idx_chain_events_event_name ON chain_events(chain_id, event_name, block_number DESC);
CREATE INDEX idx_chain_events_tx ON chain_events(chain_id, transaction_hash);

CREATE TABLE genesis_mint_events (
  chain_event_id TEXT PRIMARY KEY NOT NULL,
  buyer_address TEXT NOT NULL,
  quantity_atomic TEXT NOT NULL,
  total_paid_atomic TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  transaction_hash TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  FOREIGN KEY (chain_event_id) REFERENCES chain_events(id) ON DELETE CASCADE
);
CREATE INDEX idx_genesis_mints_buyer ON genesis_mint_events(buyer_address, block_number DESC);
