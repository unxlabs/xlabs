-- Unlimited X Labs
-- Migration 0011: Referral Quality Rules
-- Builds configurable, versioned rules on top of the referral lifecycle created in 0009.
-- Referral relationships/events remain authoritative for relationship history.
-- XP remains authoritative in xp_transactions.

PRAGMA foreign_keys = ON;

CREATE TABLE referral_quality_rule_sets (
  id TEXT PRIMARY KEY NOT NULL,
  season_id TEXT,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'retired')),
  starts_at INTEGER,
  ends_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  UNIQUE (key, version),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE UNIQUE INDEX idx_referral_rule_sets_active_global
  ON referral_quality_rule_sets(key)
  WHERE status = 'active' AND season_id IS NULL;

CREATE UNIQUE INDEX idx_referral_rule_sets_active_season
  ON referral_quality_rule_sets(key, season_id)
  WHERE status = 'active' AND season_id IS NOT NULL;

CREATE INDEX idx_referral_rule_sets_season_status
  ON referral_quality_rule_sets(season_id, status);

CREATE TABLE referral_quality_stage_rules (
  id TEXT PRIMARY KEY NOT NULL,
  rule_set_id TEXT NOT NULL,
  stage TEXT NOT NULL
    CHECK (stage IN ('activated', 'engaged', 'qualified')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  min_verified_missions INTEGER NOT NULL DEFAULT 0 CHECK (min_verified_missions >= 0),
  min_lifetime_xp INTEGER NOT NULL DEFAULT 0 CHECK (min_lifetime_xp >= 0),
  min_season_xp INTEGER NOT NULL DEFAULT 0 CHECK (min_season_xp >= 0),
  min_genesis_balance INTEGER NOT NULL DEFAULT 0 CHECK (min_genesis_balance >= 0),
  min_account_age_seconds INTEGER NOT NULL DEFAULT 0 CHECK (min_account_age_seconds >= 0),
  requirements_config TEXT,
  reward_base_xp INTEGER NOT NULL DEFAULT 0 CHECK (reward_base_xp >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (rule_set_id) REFERENCES referral_quality_rule_sets(id) ON DELETE CASCADE,
  UNIQUE (rule_set_id, stage)
);

CREATE INDEX idx_referral_stage_rules_set
  ON referral_quality_stage_rules(rule_set_id, sort_order);

-- Records which rule version caused a stage transition.
-- The actual transition event remains in referral_events.
CREATE TABLE referral_quality_evaluations (
  id TEXT PRIMARY KEY NOT NULL,
  referral_id TEXT NOT NULL,
  rule_set_id TEXT NOT NULL,
  stage TEXT NOT NULL
    CHECK (stage IN ('activated', 'engaged', 'qualified')),
  result TEXT NOT NULL
    CHECK (result IN ('passed', 'failed', 'blocked')),
  evidence TEXT,
  evaluated_at INTEGER NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  FOREIGN KEY (referral_id) REFERENCES referral_relationships(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_set_id) REFERENCES referral_quality_rule_sets(id) ON DELETE RESTRICT
);

CREATE INDEX idx_referral_quality_eval_referral
  ON referral_quality_evaluations(referral_id, evaluated_at DESC);

CREATE INDEX idx_referral_quality_eval_ruleset
  ON referral_quality_evaluations(rule_set_id, stage, result);

-- DB-level immutability for the ownership side of a referral relationship.
-- Lifecycle/status timestamps may still advance through the backend.
CREATE TRIGGER referral_relationship_owner_immutable
BEFORE UPDATE OF referrer_user_id, referred_user_id, referral_code
ON referral_relationships
FOR EACH ROW
WHEN
  NEW.referrer_user_id <> OLD.referrer_user_id
  OR NEW.referred_user_id <> OLD.referred_user_id
  OR NEW.referral_code <> OLD.referral_code
BEGIN
  SELECT RAISE(ABORT, 'referral relationship ownership is immutable');
END;
