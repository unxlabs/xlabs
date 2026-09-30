-- Unlimited X Labs
-- Migration 0013: Campaign Engine
-- Campaigns are bounded objectives/programs; Seasons remain the temporal umbrella.
-- Participation/scoring does not itself create reward entitlement.

PRAGMA foreign_keys = ON;

CREATE TABLE campaigns (
  id TEXT PRIMARY KEY NOT NULL,
  season_id TEXT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL
    CHECK (campaign_type IN (
      'general','genesis','referral','staking','deposit',
      'partner','country','community','special'
    )),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','scheduled','active','paused','ended','archived')),
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','unlisted','private')),
  join_mode TEXT NOT NULL DEFAULT 'auto'
    CHECK (join_mode IN ('auto','manual','invite','eligibility')),
  starts_at INTEGER,
  ends_at INTEGER,
  participant_cap INTEGER CHECK (participant_cap IS NULL OR participant_cap > 0),
  requirements_config TEXT,
  scoring_config TEXT,
  display_config TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL,
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX idx_campaigns_season_status
  ON campaigns(season_id, status, starts_at, ends_at);

CREATE INDEX idx_campaigns_status_visibility
  ON campaigns(status, visibility, starts_at);

CREATE TABLE campaign_missions (
  campaign_id TEXT NOT NULL,
  mission_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL DEFAULT 1 CHECK (required IN (0,1)),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (campaign_id, mission_id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE
);

CREATE INDEX idx_campaign_missions_mission ON campaign_missions(mission_id);

CREATE TABLE campaign_participants (
  id TEXT PRIMARY KEY NOT NULL,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','disqualified','withdrawn')),
  joined_at INTEGER NOT NULL,
  completed_at INTEGER,
  disqualified_at INTEGER,
  qualification_snapshot TEXT,
  progress_snapshot TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (campaign_id, user_id),
  CHECK (
    (status <> 'completed' OR completed_at IS NOT NULL)
    AND (status <> 'disqualified' OR disqualified_at IS NOT NULL)
  )
);

CREATE INDEX idx_campaign_participants_campaign_score
  ON campaign_participants(campaign_id, status, score DESC, joined_at ASC);

CREATE INDEX idx_campaign_participants_user
  ON campaign_participants(user_id, joined_at DESC);

CREATE TABLE campaign_events (
  id TEXT PRIMARY KEY NOT NULL,
  campaign_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  activity_event_id TEXT,
  event_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id TEXT,
  score_delta INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_event_id) REFERENCES trusted_activity_events(id) ON DELETE SET NULL
);

CREATE INDEX idx_campaign_events_campaign_user
  ON campaign_events(campaign_id, user_id, created_at DESC);

CREATE INDEX idx_campaign_events_source
  ON campaign_events(source_type, source_id);
