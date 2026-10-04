-- Unlimited X Labs
-- Migration 0018: Mission Step Evidence
-- Stores backend-recorded evidence for distinct steps inside multi-step missions.
-- This table tracks mission progress only; it does not award XP by itself.
-- A completed set of required steps must still pass backend mission verification.

PRAGMA foreign_keys = ON;

CREATE TABLE mission_step_evidence (
  id TEXT PRIMARY KEY NOT NULL,

  mission_id TEXT NOT NULL,

  user_id TEXT NOT NULL,

  season_id TEXT,

  -- Stable backend-defined step identifier.
  -- Examples: portfolio, earn, stake, genesis.
  step_key TEXT NOT NULL,

  -- Describes how the backend recorded the step.
  -- Mission navigation/progress is not equivalent to trusted reward activity.
  source_type TEXT NOT NULL DEFAULT 'app'
    CHECK (source_type IN (
      'app',
      'backend',
      'onchain',
      'admin',
      'system'
    )),

  -- Optional structured context about the recorded step.
  evidence TEXT,

  recorded_at INTEGER NOT NULL,

  created_at INTEGER NOT NULL,

  FOREIGN KEY (mission_id)
    REFERENCES missions(id)
    ON DELETE CASCADE,

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  FOREIGN KEY (season_id)
    REFERENCES seasons(id)
    ON DELETE SET NULL,

  -- A step can count only once for each user inside a mission.
  UNIQUE(mission_id, user_id, step_key)
);

CREATE INDEX idx_mission_step_evidence_user
  ON mission_step_evidence(user_id, recorded_at DESC);

CREATE INDEX idx_mission_step_evidence_mission
  ON mission_step_evidence(mission_id, recorded_at DESC);

CREATE INDEX idx_mission_step_evidence_mission_user
  ON mission_step_evidence(mission_id, user_id);

CREATE INDEX idx_mission_step_evidence_season
  ON mission_step_evidence(season_id, recorded_at DESC);
