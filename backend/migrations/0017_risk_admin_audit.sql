-- Unlimited X Labs
-- Migration 0017: Risk Flags + Admin Audit
-- Stores evidence-backed flags and sensitive admin change history.
-- This is infrastructure for review; it does not claim automated Sybil detection.

PRAGMA foreign_keys = ON;

CREATE TABLE user_risk_flags (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL
    CHECK (severity IN ('info','low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','reviewing','resolved','dismissed')),
  source_type TEXT NOT NULL
    CHECK (source_type IN ('system','onchain','admin','referral','mission','campaign')),
  source_id TEXT,
  reason TEXT NOT NULL,
  evidence TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  resolved_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (
    (status IN ('resolved','dismissed') AND resolved_at IS NOT NULL)
    OR (status IN ('open','reviewing') AND resolved_at IS NULL)
  )
);

CREATE INDEX idx_user_risk_flags_user
  ON user_risk_flags(user_id, status, severity);

CREATE INDEX idx_user_risk_flags_status
  ON user_risk_flags(status, severity, created_at DESC);

CREATE TABLE admin_audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  admin_user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  reason TEXT,
  old_value TEXT,
  new_value TEXT,
  request_id TEXT,
  created_at INTEGER NOT NULL,

  -- admin_users.user_id is itself a FK to users.id.
  -- Referencing admin_users here guarantees the actor was an admin identity,
  -- not merely any platform user.
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(user_id) ON DELETE RESTRICT
);

CREATE INDEX idx_admin_audit_admin
  ON admin_audit_log(admin_user_id, created_at DESC);

CREATE INDEX idx_admin_audit_target
  ON admin_audit_log(target_type, target_id, created_at DESC);

CREATE INDEX idx_admin_audit_action
  ON admin_audit_log(action, created_at DESC);

CREATE UNIQUE INDEX idx_admin_audit_request
  ON admin_audit_log(request_id)
  WHERE request_id IS NOT NULL;
