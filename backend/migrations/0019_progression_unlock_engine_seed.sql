-- Unlimited X Labs
-- Migration 0019: Progression unlock engine definitions
-- Adds the first production milestone and achievement definitions.
-- XP remains the source of truth; these rows only define durable recognition.

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO progression_milestones
(id, season_id, key, name, description, metric_type, target_value, requirements_config, reward_config, status, sort_order, starts_at, ends_at, created_at, updated_at)
VALUES
('milestone-first-mission', NULL, 'first-mission', 'First Verified Mission', 'Complete your first verified mission.', 'missions_completed', 1, NULL, NULL, 'active', 10, NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('milestone-missions-3', NULL, 'missions-3', 'Building Momentum', 'Complete 3 verified missions.', 'missions_completed', 3, NULL, NULL, 'active', 20, NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('milestone-missions-5', NULL, 'missions-5', 'Proven Participant', 'Complete 5 verified missions.', 'missions_completed', 5, NULL, NULL, 'active', 30, NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('milestone-xp-500', NULL, 'lifetime-xp-500', '500 Lifetime XP', 'Reach 500 verified Lifetime XP.', 'lifetime_xp', 500, NULL, NULL, 'active', 40, NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('milestone-xp-1500', NULL, 'lifetime-xp-1500', '1,500 Lifetime XP', 'Reach 1,500 verified Lifetime XP.', 'lifetime_xp', 1500, NULL, NULL, 'active', 50, NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('milestone-qualified-referral-1', NULL, 'qualified-referral-1', 'First Qualified Referral', 'Grow your network to its first qualified referral.', 'qualified_referrals', 1, NULL, NULL, 'active', 60, NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('milestone-genesis-1', NULL, 'genesis-1', 'Genesis Member', 'Hold at least one verified Genesis Pass.', 'genesis_balance', 1, NULL, NULL, 'active', 70, NULL, NULL, unixepoch()*1000, unixepoch()*1000);

INSERT OR IGNORE INTO achievements
(id, key, name, description, category, rarity, criteria_type, criteria_config, icon_key, visual_config, share_config, status, starts_at, ends_at, created_at, updated_at)
VALUES
('achievement-first-step', 'first-step', 'First Step', 'Complete your first verified mission.', 'explore', 'common', 'metric', '{"metric":"missions_completed","target":1}', 'first-step', NULL, NULL, 'active', NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('achievement-both-sides', 'both-sides', 'Both Sides', 'Use both Earn and Stake with verified on-chain activity.', 'engage', 'rare', 'trusted_event_all', '{"eventTypes":["earn_deposit","stake_deposit"],"sourceType":"onchain"}', 'both-sides', NULL, NULL, 'active', NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('achievement-genesis-member', 'genesis-member', 'Genesis Member', 'Become a verified Genesis Pass holder.', 'genesis', 'uncommon', 'metric', '{"metric":"genesis_balance","target":1}', 'genesis', NULL, NULL, 'active', NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('achievement-network-builder', 'network-builder', 'Network Builder', 'Reach your first qualified referral.', 'invite', 'rare', 'metric', '{"metric":"qualified_referrals","target":1}', 'network-builder', NULL, NULL, 'active', NULL, NULL, unixepoch()*1000, unixepoch()*1000),
('achievement-verified-5', 'verified-5', 'Proven Participant', 'Complete 5 verified missions.', 'build', 'uncommon', 'metric', '{"metric":"missions_completed","target":5}', 'verified-5', NULL, NULL, 'active', NULL, NULL, unixepoch()*1000, unixepoch()*1000);
