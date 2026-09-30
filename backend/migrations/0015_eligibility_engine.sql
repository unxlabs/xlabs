-- Unlimited X Labs
-- Migration 0015: Eligibility Engine
-- Eligibility is explainable and versioned. It is not a reward payment.
-- Each evaluation stores both the overall result and per-rule evidence.

PRAGMA foreign_keys = ON;

CREATE TABLE eligibility_programs (
  id TEXT PRIMARY KEY NOT NULL,
  season_id TEXT,
  campaign_id TEXT,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  program_type TEXT NOT NULL
    CHECK (program_type IN ('airdrop','campaign_reward','access','allowlist','special')),
  version INTEGER NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','frozen','archived')),
  starts_at INTEGER,
  ends_at INTEGER,
  frozen_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
  UNIQUE (key, version),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  CHECK (status <> 'frozen' OR frozen_at IS NOT NULL)
);

CREATE INDEX idx_eligibility_programs_scope
  ON eligibility_programs(season_id, campaign_id, status);

CREATE TABLE eligibility_rules (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL
    CHECK (rule_type IN (
      'lifetime_xp','season_xp','mission_count','qualified_referrals',
      'genesis_balance','campaign_score','trusted_activity','custom'
    )),
  operator TEXT NOT NULL
    CHECK (operator IN ('gte','gt','eq','lte','lt','exists','not_exists')),
  target_value INTEGER,
  config TEXT,
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES eligibility_programs(id) ON DELETE CASCADE,
  UNIQUE (program_id, key)
);

CREATE INDEX idx_eligibility_rules_program
  ON eligibility_rules(program_id, sort_order);

CREATE TABLE eligibility_evaluations (
  id TEXT PRIMARY KEY NOT NULL,
  program_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  result TEXT NOT NULL
    CHECK (result IN ('eligible','ineligible','review','excluded')),
  passed_required INTEGER NOT NULL DEFAULT 0 CHECK (passed_required >= 0),
  total_required INTEGER NOT NULL DEFAULT 0 CHECK (total_required >= 0),
  reason_summary TEXT,
  evaluated_at INTEGER NOT NULL,
  evaluation_key TEXT NOT NULL UNIQUE,
  frozen INTEGER NOT NULL DEFAULT 0 CHECK (frozen IN (0,1)),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES eligibility_programs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_eligibility_eval_program_result
  ON eligibility_evaluations(program_id, result, evaluated_at DESC);

CREATE INDEX idx_eligibility_eval_user
  ON eligibility_evaluations(user_id, evaluated_at DESC);

CREATE TABLE eligibility_rule_results (
  evaluation_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  passed INTEGER NOT NULL CHECK (passed IN (0,1)),
  observed_value TEXT,
  reason TEXT,
  evidence TEXT,
  PRIMARY KEY (evaluation_id, rule_id),
  FOREIGN KEY (evaluation_id) REFERENCES eligibility_evaluations(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES eligibility_rules(id) ON DELETE RESTRICT
);

CREATE INDEX idx_eligibility_rule_results_rule
  ON eligibility_rule_results(rule_id, passed);
