import {

  createPublicClient,

  formatUnits,

  getAddress,

  http,

  isAddress,

  parseAbi,

  verifyMessage,

  type Hex,

} from "viem";



export interface Env {

  DB: D1Database;

  BNB_RPC_URL: string;

}



const AUTH_CHAIN_ID = 56;

const AUTH_CHALLENGE_TTL_SECONDS = 5 * 60;

const AUTH_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const GENESIS_CONTRACT_ADDRESS =
  "0x3d71D114B58bd47477BDf5DEF6620a5b0F23842E" as const;
const GENESIS_PASS_ID = 1n;
const GENESIS_SYNC_COOLDOWN_MS = 60 * 1000;
const GENESIS_ABI = parseAbi([
  "function balanceOf(address account, uint256 id) view returns (uint256)",
]);



const ALLOWED_ORIGINS = new Set([

  "https://unxlabs.xyz",

  "https://www.unxlabs.xyz",

  "http://localhost:5173",

  "http://127.0.0.1:5173",

]);



interface AuthChallengeRow {

  id: string;

  wallet_address: string;

  chain_id: number;

  nonce: string;

  message: string;

  status: "pending" | "used" | "expired";

  created_at: number;

  expires_at: number;

  used_at: number | null;

}



interface WalletRow {

  id: string;

  user_id: string;

  address: string;

  chain_id: number;

  is_primary: number;

  status: string;

  connected_at: number;

  last_seen_at: number;

}



interface UserRow {

  id: string;

  username: string | null;

  referral_code: string;

  referred_by_user_id: string | null;

  country: string | null;

  status: string;

  created_at: number;

  last_active_at: number;

}



interface AuthSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  status: "active" | "revoked" | "expired";
  created_at: number;
  expires_at: number;
  last_seen_at: number;
  revoked_at: number | null;
}

interface GenesisOwnershipRow {
  user_id: string;
  wallet_address: string;
  chain_id: number;
  contract_address: string;
  token_id: string;
  balance: number;
  tier_key: string;
  tier_name: string;
  xp_boost_percent: number;
  referral_boost_percent: number;
  synced_at: number;
  created_at: number;
  updated_at: number;
}

interface XpBalanceRow {
  user_id: string;
  lifetime_xp: number;
  updated_at: number;
}

type XpSourceType =
  | "mission"
  | "referral"
  | "daily"
  | "genesis"
  | "admin"
  | "campaign"
  | "system";

interface XpTransactionRow {
  id: string;
  user_id: string;
  season_id: string | null;
  source_type: XpSourceType;
  source_id: string | null;
  base_xp: number;
  boost_xp: number;
  total_xp: number;
  multiplier_bps: number;
  reason: string | null;
  status: "active" | "reversed";
  idempotency_key: string;
  created_at: number;
  reversed_at: number | null;
}

type XpBoostType = "xp" | "referral" | "none";

export interface AwardXpInput {
  userId: string;
  sourceType: XpSourceType;
  sourceId?: string | null;
  seasonId?: string | null;
  baseXp: number;
  reason?: string | null;
  idempotencyKey: string;
  boostType?: XpBoostType;
}

export interface AwardXpResult {
  created: boolean;
  transaction: XpTransactionRow;
  lifetimeXp: number;
  seasonXp: number | null;
}

interface SeasonRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "ended" | "archived";
  is_current: number;
  starts_at: number | null;
  ends_at: number | null;
  created_at: number;
  updated_at: number;
}

interface SeasonParticipantRow {
  id: string;
  season_id: string;
  user_id: string;
  status: "active" | "completed" | "disqualified";
  season_xp: number;
  joined_at: number;
  last_active_at: number;
  updated_at: number;
}

type MissionCategory = "explore" | "engage" | "spread" | "invite" | "build";
type MissionVerificationType = "instant" | "onchain" | "referral" | "social" | "manual" | "system";
type MissionStatus = "draft" | "active" | "paused" | "ended" | "archived";
type MissionRepeatType = "once" | "daily" | "weekly" | "repeatable";

interface MissionRow {
  id: string;
  season_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  category: MissionCategory;
  verification_type: MissionVerificationType;
  base_xp: number;
  status: MissionStatus;
  repeat_type: MissionRepeatType;
  max_completions: number | null;
  verification_config: string | null;
  sort_order: number;
  starts_at: number | null;
  ends_at: number | null;
  created_at: number;
  updated_at: number;
}

interface UserMissionProgressRow {
  id: string;
  mission_id: string;
  user_id: string;
  status: "available" | "in_progress" | "completed" | "blocked";
  progress_value: number;
  target_value: number;
  completion_count: number;
  first_started_at: number | null;
  last_progress_at: number | null;
  last_completed_at: number | null;
  created_at: number;
  updated_at: number;
}

interface MissionCompletionSummaryRow {
  mission_id: string;
  completion_count: number;
  last_completed_at: number | null;
}

interface MissionCompletionRow {
  id: string;
  mission_id: string;
  user_id: string;
  season_id: string | null;
  period_key: string;
  base_xp: number;
  status: "verified" | "rewarded" | "rejected" | "reversed";
  xp_transaction_id: string | null;
  verification_data: string | null;
  verified_at: number | null;
  rewarded_at: number | null;
  reversed_at: number | null;
  created_at: number;
  updated_at: number;
}

interface MissionStepEvidenceRow {
  mission_id: string;
  user_id: string;
  step_key: string;
  recorded_at: number;
}

interface AppStepsMissionConfig {
  mode: "app_steps";
  requiredSteps: string[];
}


type ReferralStage = "joined" | "activated" | "engaged" | "qualified" | "blocked";

interface ReferralRelationshipRow {
  id: string;
  referrer_user_id: string;
  referred_user_id: string;
  referral_code: string;
  status: ReferralStage;
  joined_at: number;
  activated_at: number | null;
  engaged_at: number | null;
  qualified_at: number | null;
  blocked_at: number | null;
  created_at: number;
  updated_at: number;
}

interface ReferralNetworkRow {
  referral_id: string;
  referred_user_id: string;
  username: string | null;
  wallet_address: string;
  status: ReferralStage;
  joined_at: number;
  activated_at: number | null;
  engaged_at: number | null;
  qualified_at: number | null;
}

interface ReferralStageCountsRow {
  total: number;
  joined: number;
  activated: number;
  engaged: number;
  qualified: number;
  blocked: number;
}

interface AuthenticatedContext {
  session: AuthSessionRow;
  user: UserRow;
  wallet: WalletRow;
}

interface AdminUserRow {
  user_id: string;
  role: "admin" | "super_admin";
  status: "active" | "disabled";
  created_at: number;
  updated_at: number;
}

interface CountRow {
  count: number;
}

interface SumRow {
  total: number | null;
}

interface TierDistributionRow {
  tier_key: string;
  tier_name: string;
  holders: number;
  passes: number;
}

interface AdminWalletListRow {
  user_id: string;
  username: string | null;
  user_status: string;
  user_created_at: number;
  last_active_at: number;
  wallet_address: string;
  wallet_status: string;
  connected_at: number;
  wallet_last_seen_at: number;
  genesis_balance: number | null;
  tier_key: string | null;
  tier_name: string | null;
  genesis_synced_at: number | null;
}

const ADMIN_USDT_TOKEN = "0x55d398326f99059fF775485246999027B3197955" as const;
const ADMIN_BTCB_TOKEN = "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c" as const;
const ADMIN_ERC20_BALANCE_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
]);

const SESSION_COOKIE_NAME = "__Host-unxlabs_session";

function isLocalDevelopmentOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return (
    origin === "http://localhost:5173" ||
    origin === "http://127.0.0.1:5173"
  );
}

function buildSessionCookie(
  request: Request,
  token: string,
  maxAgeSeconds: number,
): string {
  const sameSite = isLocalDevelopmentOrigin(request) ? "None" : "Lax";
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    `SameSite=${sameSite}`,
    `Max-Age=${maxAgeSeconds}`,
  ].join("; ");
}

function buildExpiredSessionCookie(request: Request): string {
  return buildSessionCookie(request, "", 0);
}

function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = part.trim().split("=");
    if (rawName === name) return rawValueParts.join("=") || null;
  }
  return null;
}

function getCorsHeaders(request: Request): HeadersInit {

  const origin = request.headers.get("Origin");



  const headers: Record<string, string> = {

    Vary: "Origin",

  };



  if (origin && ALLOWED_ORIGINS.has(origin)) {

    headers["Access-Control-Allow-Origin"] = origin;

    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";

    headers["Access-Control-Allow-Headers"] =

      "Content-Type, Authorization";

    headers["Access-Control-Allow-Credentials"] = "true";

    headers["Access-Control-Max-Age"] = "86400";

  }



  return headers;

}



function jsonResponse(

  request: Request,

  data: unknown,

  status = 200,

  extraHeaders: HeadersInit = {},

): Response {

  return new Response(JSON.stringify(data, null, 2), {

    status,

    headers: {

      "Content-Type": "application/json; charset=UTF-8",

      "Cache-Control": "no-store",

      ...getCorsHeaders(request),

      ...extraHeaders,

    },

  });

}



function optionsResponse(request: Request): Response {

  const origin = request.headers.get("Origin");



  if (!origin || !ALLOWED_ORIGINS.has(origin)) {

    return new Response(null, {

      status: 403,

      headers: {

        Vary: "Origin",

      },

    });

  }



  return new Response(null, {

    status: 204,

    headers: getCorsHeaders(request),

  });

}



function generateRandomHex(byteLength = 32): string {

  const bytes = new Uint8Array(byteLength);

  crypto.getRandomValues(bytes);



  return Array.from(bytes)

    .map((byte) => byte.toString(16).padStart(2, "0"))

    .join("");

}



function generateNonce(): string {

  return generateRandomHex(32);

}



function generateSessionToken(): string {

  return generateRandomHex(48);

}



function generateReferralCode(): string {

  return generateRandomHex(8).toUpperCase();

}



async function sha256(value: string): Promise<string> {

  const data = new TextEncoder().encode(value);

  const digest = await crypto.subtle.digest("SHA-256", data);



  return Array.from(new Uint8Array(digest))

    .map((byte) => byte.toString(16).padStart(2, "0"))

    .join("");

}



function buildAuthMessage(params: {

  address: string;

  nonce: string;

  issuedAt: number;

  expiresAt: number;

}): string {

  const { address, nonce, issuedAt, expiresAt } = params;



  return [

    "Unlimited X Labs",

    "",

    "Sign this message to authenticate your wallet.",

    "This request will not trigger a blockchain transaction or cost gas.",

    "",

    `Wallet: ${address}`,

    `Chain ID: ${AUTH_CHAIN_ID}`,

    `Nonce: ${nonce}`,

    `Issued At: ${new Date(issuedAt).toISOString()}`,

    `Expiration Time: ${new Date(expiresAt).toISOString()}`,

  ].join("\n");

}



async function createUniqueReferralCode(

  db: D1Database,

): Promise<string> {

  for (let attempt = 0; attempt < 10; attempt++) {

    const referralCode = generateReferralCode();



    const existing = await db

      .prepare(

        `

        SELECT id

        FROM users

        WHERE referral_code = ?

        LIMIT 1

        `,

      )

      .bind(referralCode)

      .first<{ id: string }>();



    if (!existing) {

      return referralCode;

    }

  }



  throw new Error("Unable to generate a unique referral code.");

}



function getGenesisTier(balance: number) {
  if (balance >= 50) return { key: "founder", name: "Founder", xpBoost: 75, referralBoost: 35 };
  if (balance >= 25) return { key: "prime", name: "Prime", xpBoost: 55, referralBoost: 25 };
  if (balance >= 10) return { key: "apex", name: "Apex", xpBoost: 40, referralBoost: 20 };
  if (balance >= 5) return { key: "elite", name: "Elite", xpBoost: 30, referralBoost: 15 };
  if (balance >= 3) return { key: "genesis_plus", name: "Genesis+", xpBoost: 20, referralBoost: 10 };
  if (balance >= 1) return { key: "genesis", name: "Genesis", xpBoost: 10, referralBoost: 5 };
  return { key: "none", name: "None", xpBoost: 0, referralBoost: 0 };
}

function serializeGenesisOwnership(row: GenesisOwnershipRow) {
  return {
    walletAddress: getAddress(row.wallet_address),
    chainId: row.chain_id,
    contractAddress: getAddress(row.contract_address),
    tokenId: row.token_id,
    balance: row.balance,
    tier: { key: row.tier_key, name: row.tier_name },
    xpBoostPercent: row.xp_boost_percent,
    referralBoostPercent: row.referral_boost_percent,
    syncedAt: row.synced_at,
  };
}

async function getAuthenticatedContext(
  request: Request,
  env: Env,
): Promise<AuthenticatedContext | null> {
  const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
  if (!sessionToken) return null;

  const tokenHash = await sha256(sessionToken);
  const now = Date.now();
  const session = await env.DB.prepare(
    `SELECT id, user_id, token_hash, status, created_at,
            expires_at, last_seen_at, revoked_at
     FROM auth_sessions
     WHERE token_hash = ?
     LIMIT 1`,
  ).bind(tokenHash).first<AuthSessionRow>();

  if (!session || session.status !== "active" || session.expires_at <= now) return null;

  const user = await env.DB.prepare(
    `SELECT id, username, referral_code, referred_by_user_id,
            country, status, created_at, last_active_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
  ).bind(session.user_id).first<UserRow>();
  if (!user || user.status !== "active") return null;

  const wallet = await env.DB.prepare(
    `SELECT id, user_id, address, chain_id, is_primary, status,
            connected_at, last_seen_at
     FROM wallets
     WHERE user_id = ? AND is_primary = 1
     ORDER BY connected_at ASC
     LIMIT 1`,
  ).bind(user.id).first<WalletRow>();

  if (!wallet || wallet.status === "blocked" || wallet.chain_id !== AUTH_CHAIN_ID) return null;
  return { session, user, wallet };
}

async function getActiveAdmin(
  db: D1Database,
  userId: string,
): Promise<AdminUserRow | null> {
  return db.prepare(
    `SELECT user_id, role, status, created_at, updated_at
     FROM admin_users
     WHERE user_id = ? AND status = 'active'
     LIMIT 1`,
  ).bind(userId).first<AdminUserRow>();
}

async function getGenesisOwnership(
  db: D1Database,
  userId: string,
): Promise<GenesisOwnershipRow | null> {
  return db.prepare(
    `SELECT user_id, wallet_address, chain_id, contract_address, token_id,
            balance, tier_key, tier_name, xp_boost_percent,
            referral_boost_percent, synced_at, created_at, updated_at
     FROM genesis_ownership
     WHERE user_id = ?
     LIMIT 1`,
  ).bind(userId).first<GenesisOwnershipRow>();
}

async function getXpBalance(
  db: D1Database,
  userId: string,
): Promise<XpBalanceRow | null> {
  return db.prepare(
    `SELECT user_id, lifetime_xp, updated_at
     FROM xp_balances
     WHERE user_id = ?
     LIMIT 1`,
  ).bind(userId).first<XpBalanceRow>();
}

async function getXpTransactionByIdempotencyKey(
  db: D1Database,
  idempotencyKey: string,
): Promise<XpTransactionRow | null> {
  return db.prepare(
    `SELECT id, user_id, season_id, source_type, source_id,
            base_xp, boost_xp, total_xp, multiplier_bps, reason,
            status, idempotency_key, created_at, reversed_at
     FROM xp_transactions
     WHERE idempotency_key = ?
     LIMIT 1`,
  ).bind(idempotencyKey).first<XpTransactionRow>();
}

function serializeXpTransaction(row: XpTransactionRow) {
  return {
    id: row.id,
    seasonId: row.season_id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    baseXp: row.base_xp,
    boostXp: row.boost_xp,
    totalXp: row.total_xp,
    multiplierBps: row.multiplier_bps,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at,
    reversedAt: row.reversed_at,
  };
}

async function getSeason(db: D1Database, seasonId: string): Promise<SeasonRow | null> {
  return db.prepare(
    `SELECT id, slug, name, description, status, is_current, starts_at, ends_at, created_at, updated_at
     FROM seasons WHERE id = ? LIMIT 1`,
  ).bind(seasonId).first<SeasonRow>();
}

async function getCurrentSeason(db: D1Database): Promise<SeasonRow | null> {
  return db.prepare(
    `SELECT id, slug, name, description, status, is_current, starts_at, ends_at, created_at, updated_at
     FROM seasons WHERE is_current = 1 LIMIT 1`,
  ).first<SeasonRow>();
}

async function getSeasonParticipant(
  db: D1Database, seasonId: string, userId: string,
): Promise<SeasonParticipantRow | null> {
  return db.prepare(
    `SELECT id, season_id, user_id, status, season_xp, joined_at, last_active_at, updated_at
     FROM season_participants WHERE season_id = ? AND user_id = ? LIMIT 1`,
  ).bind(seasonId, userId).first<SeasonParticipantRow>();
}

function serializeSeason(row: SeasonRow) {
  return {
    id: row.id, slug: row.slug, name: row.name, description: row.description,
    status: row.status, isCurrent: row.is_current === 1, startsAt: row.starts_at,
    endsAt: row.ends_at, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function serializeSeasonParticipant(row: SeasonParticipantRow) {
  return {
    id: row.id, seasonId: row.season_id, userId: row.user_id, status: row.status,
    seasonXp: row.season_xp, joinedAt: row.joined_at, lastActiveAt: row.last_active_at,
    updatedAt: row.updated_at,
  };
}

function isSeasonOpen(season: SeasonRow, now: number): boolean {
  return season.status === "active" && season.is_current === 1 &&
    (season.starts_at === null || season.starts_at <= now) &&
    (season.ends_at === null || season.ends_at > now);
}

const MISSION_CATEGORIES = new Set<MissionCategory>([
  "explore", "engage", "spread", "invite", "build",
]);
const MISSION_VERIFICATION_TYPES = new Set<MissionVerificationType>([
  "instant", "onchain", "referral", "social", "manual", "system",
]);
const MISSION_REPEAT_TYPES = new Set<MissionRepeatType>([
  "once", "daily", "weekly", "repeatable",
]);

async function getMission(db: D1Database, missionId: string): Promise<MissionRow | null> {
  return db.prepare(
    `SELECT id, season_id, slug, name, description, category, verification_type,
            base_xp, status, repeat_type, max_completions, verification_config,
            sort_order, starts_at, ends_at, created_at, updated_at
     FROM missions
     WHERE id = ?
     LIMIT 1`,
  ).bind(missionId).first<MissionRow>();
}

function isMissionScheduledNow(mission: MissionRow, now: number): boolean {
  return (
    (mission.starts_at === null || mission.starts_at <= now) &&
    (mission.ends_at === null || mission.ends_at > now)
  );
}

function getAppStepsMissionConfig(mission: MissionRow): AppStepsMissionConfig | null {
  if (mission.verification_type !== "system" || !mission.verification_config) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(mission.verification_config);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const config = parsed as Record<string, unknown>;
  if (config.mode !== "app_steps" || !Array.isArray(config.requiredSteps)) return null;

  const requiredSteps = config.requiredSteps
    .filter((step): step is string => typeof step === "string")
    .map((step) => step.trim().toLowerCase())
    .filter((step, index, all) => step.length > 0 && all.indexOf(step) === index);

  if (requiredSteps.length === 0) return null;
  return { mode: "app_steps", requiredSteps };
}

function serializeMission(row: MissionRow, now = Date.now()) {
  return {
    id: row.id,
    seasonId: row.season_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    verificationType: row.verification_type,
    appSteps: (() => {
      const config = getAppStepsMissionConfig(row);
      return config ? { requiredSteps: config.requiredSteps } : null;
    })(),
    baseXp: row.base_xp,
    status: row.status,
    repeatType: row.repeat_type,
    maxCompletions: row.max_completions,
    sortOrder: row.sort_order,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    availableNow: row.status === "active" && isMissionScheduledNow(row, now),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeMissionProgress(row: UserMissionProgressRow | null) {
  if (!row) {
    return {
      status: "available",
      progressValue: 0,
      targetValue: 1,
      completionCount: 0,
      firstStartedAt: null,
      lastProgressAt: null,
      lastCompletedAt: null,
    };
  }

  return {
    status: row.status,
    progressValue: row.progress_value,
    targetValue: row.target_value,
    completionCount: row.completion_count,
    firstStartedAt: row.first_started_at,
    lastProgressAt: row.last_progress_at,
    lastCompletedAt: row.last_completed_at,
  };
}


function getUtcMissionPeriodKey(mission: MissionRow, now: number): string {
  if (mission.repeat_type === "once") return "once";

  const date = new Date(now);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  if (mission.repeat_type === "daily") return `${year}-${month}-${day}`;

  if (mission.repeat_type === "weekly") {
    const utcDate = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
    const weekday = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - weekday);
    const isoYear = utcDate.getUTCFullYear();
    const yearStart = new Date(Date.UTC(isoYear, 0, 1));
    const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${isoYear}-W${String(week).padStart(2, "0")}`;
  }

  throw new Error("Repeatable missions require a trusted event key.");
}

async function getMissionCompletion(
  db: D1Database,
  missionId: string,
  userId: string,
  periodKey: string,
): Promise<MissionCompletionRow | null> {
  return db.prepare(
    `SELECT id, mission_id, user_id, season_id, period_key, base_xp, status,
            xp_transaction_id, verification_data, verified_at, rewarded_at,
            reversed_at, created_at, updated_at
     FROM mission_completions
     WHERE mission_id = ? AND user_id = ? AND period_key = ?
     LIMIT 1`,
  ).bind(missionId, userId, periodKey).first<MissionCompletionRow>();
}

async function rewardVerifiedMissionCompletion(
  db: D1Database,
  mission: MissionRow,
  userId: string,
  options: {
    trustedEventKey?: string | null;
    verificationData?: Record<string, unknown> | null;
  } = {},
): Promise<{ completion: MissionCompletionRow; award: AwardXpResult }> {
  const now = Date.now();

  if (mission.status !== "active" || !isMissionScheduledNow(mission, now)) {
    throw new Error("Mission is not currently available.");
  }
  if (!mission.season_id) throw new Error("Mission is not linked to a season.");

  const season = await getSeason(db, mission.season_id);
  if (!season || !isSeasonOpen(season, now)) {
    throw new Error("Mission season is not currently active.");
  }

  const participant = await getSeasonParticipant(db, mission.season_id, userId);
  if (!participant || participant.status !== "active") {
    throw new Error("User is not an active participant in this season.");
  }

  let periodKey: string;
  if (mission.repeat_type === "repeatable") {
    const trustedEventKey = options.trustedEventKey?.trim() || "";
    if (!trustedEventKey) throw new Error("Repeatable missions require a trusted event key.");
    periodKey = `event:${trustedEventKey}`;
  } else {
    periodKey = getUtcMissionPeriodKey(mission, now);
  }

  let completion = await getMissionCompletion(db, mission.id, userId, periodKey);
  if (!completion) {
    const countRow = await db.prepare(
      `SELECT COUNT(*) AS count FROM mission_completions
       WHERE mission_id = ? AND user_id = ? AND status IN ('verified', 'rewarded')`,
    ).bind(mission.id, userId).first<CountRow>();

    const currentCount = countRow?.count ?? 0;
    const effectiveMax = mission.repeat_type === "once" ? 1 : mission.max_completions;
    if (effectiveMax !== null && currentCount >= effectiveMax) {
      throw new Error("Mission completion limit has been reached.");
    }

    const completionId = crypto.randomUUID();
    const verificationData = options.verificationData
      ? JSON.stringify(options.verificationData)
      : null;

    try {
      await db.prepare(
        `INSERT INTO mission_completions (
           id, mission_id, user_id, season_id, period_key, base_xp, status,
           xp_transaction_id, verification_data, verified_at, rewarded_at,
           reversed_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'verified', NULL, ?, ?, NULL, NULL, ?, ?)`,
      ).bind(
        completionId, mission.id, userId, mission.season_id, periodKey,
        mission.base_xp, verificationData, now, now, now,
      ).run();
    } catch (error) {
      const raced = await getMissionCompletion(db, mission.id, userId, periodKey);
      if (!raced) throw error;
    }

    completion = await getMissionCompletion(db, mission.id, userId, periodKey);
    if (!completion) throw new Error("Mission completion could not be read back.");
  }

  if (completion.status === "rejected" || completion.status === "reversed") {
    throw new Error("Mission completion is not rewardable.");
  }

  const award = await awardXp(db, {
    userId,
    sourceType: "mission",
    sourceId: mission.id,
    seasonId: mission.season_id,
    baseXp: completion.base_xp,
    reason: `Mission completed: ${mission.name}`,
    idempotencyKey: `mission:${completion.id}`,
    boostType: "xp",
  });

  const updateNow = Date.now();
  await db.batch([
    db.prepare(
      `UPDATE mission_completions
       SET status = 'rewarded', xp_transaction_id = ?,
           rewarded_at = COALESCE(rewarded_at, ?), updated_at = ?
       WHERE id = ? AND status IN ('verified', 'rewarded')`,
    ).bind(award.transaction.id, updateNow, updateNow, completion.id),
    db.prepare(
      `INSERT INTO user_mission_progress (
         id, mission_id, user_id, status, progress_value, target_value,
         completion_count, first_started_at, last_progress_at,
         last_completed_at, created_at, updated_at
       ) VALUES (?, ?, ?, ?, 1, 1, 1, ?, ?, ?, ?, ?)
       ON CONFLICT(mission_id, user_id) DO UPDATE SET
         status = excluded.status,
         progress_value = 1,
         target_value = 1,
         completion_count = (
           SELECT COUNT(*) FROM mission_completions
           WHERE mission_id = excluded.mission_id
             AND user_id = excluded.user_id
             AND status IN ('verified', 'rewarded')
         ),
         first_started_at = COALESCE(user_mission_progress.first_started_at, excluded.first_started_at),
         last_progress_at = excluded.last_progress_at,
         last_completed_at = excluded.last_completed_at,
         updated_at = excluded.updated_at`,
    ).bind(
      crypto.randomUUID(), mission.id, userId,
      mission.repeat_type === "once" ? "completed" : "available",
      now, now, now, now, now,
    ),
  ]);

  completion = await getMissionCompletion(db, mission.id, userId, periodKey);
  if (!completion) throw new Error("Rewarded mission completion could not be read back.");
  return { completion, award };
}


async function getReferralRelationshipByReferredUser(
  db: D1Database,
  userId: string,
): Promise<ReferralRelationshipRow | null> {
  return db.prepare(
    `SELECT id, referrer_user_id, referred_user_id, referral_code, status,
            joined_at, activated_at, engaged_at, qualified_at, blocked_at,
            created_at, updated_at
     FROM referral_relationships
     WHERE referred_user_id = ?
     LIMIT 1`,
  ).bind(userId).first<ReferralRelationshipRow>();
}

async function getReferralRelationshipById(
  db: D1Database,
  referralId: string,
): Promise<ReferralRelationshipRow | null> {
  return db.prepare(
    `SELECT id, referrer_user_id, referred_user_id, referral_code, status,
            joined_at, activated_at, engaged_at, qualified_at, blocked_at,
            created_at, updated_at
     FROM referral_relationships
     WHERE id = ?
     LIMIT 1`,
  ).bind(referralId).first<ReferralRelationshipRow>();
}

function serializeReferralRelationship(row: ReferralRelationshipRow) {
  return {
    id: row.id,
    referrerUserId: row.referrer_user_id,
    referredUserId: row.referred_user_id,
    referralCode: row.referral_code,
    status: row.status,
    joinedAt: row.joined_at,
    activatedAt: row.activated_at,
    engagedAt: row.engaged_at,
    qualifiedAt: row.qualified_at,
    blockedAt: row.blocked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function attachReferral(
  db: D1Database,
  referredUser: UserRow,
  suppliedCode: string,
): Promise<{ created: boolean; relationship: ReferralRelationshipRow }> {
  const referralCode = suppliedCode.trim().toUpperCase();
  if (!referralCode) throw new Error("Referral code is required.");

  const existing = await getReferralRelationshipByReferredUser(db, referredUser.id);
  if (existing) {
    if (existing.referral_code !== referralCode) {
      throw new Error("This account is already linked to another referrer.");
    }
    return { created: false, relationship: existing };
  }

  if (referredUser.referred_by_user_id) {
    throw new Error("This account already has a referrer.");
  }

  const referrer = await db.prepare(
    `SELECT id, username, referral_code, referred_by_user_id, country,
            status, created_at, last_active_at
     FROM users
     WHERE referral_code = ?
     LIMIT 1`,
  ).bind(referralCode).first<UserRow>();

  if (!referrer || referrer.status !== "active") {
    throw new Error("Referral code is invalid or inactive.");
  }
  if (referrer.id === referredUser.id) {
    throw new Error("Self-referrals are not allowed.");
  }

  const now = Date.now();
  const referralId = crypto.randomUUID();
  const eventId = crypto.randomUUID();
  const eventKey = `referral:${referralId}:joined`;

  try {
    await db.batch([
      db.prepare(
        `INSERT INTO referral_relationships (
           id, referrer_user_id, referred_user_id, referral_code, status,
           joined_at, activated_at, engaged_at, qualified_at, blocked_at,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, 'joined', ?, NULL, NULL, NULL, NULL, ?, ?)`,
      ).bind(referralId, referrer.id, referredUser.id, referralCode, now, now, now),
      db.prepare(
        `UPDATE users
         SET referred_by_user_id = ?
         WHERE id = ? AND referred_by_user_id IS NULL`,
      ).bind(referrer.id, referredUser.id),
      db.prepare(
        `INSERT INTO referral_events (
           id, referral_id, referrer_user_id, referred_user_id, event_type,
           stage, source_type, source_id, season_id, idempotency_key,
           metadata, created_at
         ) VALUES (?, ?, ?, ?, 'joined', 'joined', 'referral_code', ?, NULL, ?, NULL, ?)`,
      ).bind(eventId, referralId, referrer.id, referredUser.id, referralCode, eventKey, now),
    ]);
  } catch (error) {
    const raced = await getReferralRelationshipByReferredUser(db, referredUser.id);
    if (!raced) throw error;
    if (raced.referral_code !== referralCode) {
      throw new Error("This account is already linked to another referrer.");
    }
    return { created: false, relationship: raced };
  }

  const relationship = await getReferralRelationshipById(db, referralId);
  if (!relationship) throw new Error("Referral relationship was written but could not be read back.");
  return { created: true, relationship };
}

export async function awardXp(
  db: D1Database,
  input: AwardXpInput,
): Promise<AwardXpResult> {
  if (!Number.isSafeInteger(input.baseXp) || input.baseXp < 0) {
    throw new Error("XP base amount must be a non-negative safe integer.");
  }

  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) throw new Error("XP idempotency key is required.");

  const existing = await getXpTransactionByIdempotencyKey(db, idempotencyKey);
  if (existing) {
    if (existing.user_id !== input.userId) throw new Error("XP idempotency key belongs to another user.");
    const [balance, participant] = await Promise.all([
      getXpBalance(db, input.userId),
      existing.season_id ? getSeasonParticipant(db, existing.season_id, input.userId) : Promise.resolve(null),
    ]);
    return { created: false, transaction: existing, lifetimeXp: balance?.lifetime_xp ?? 0, seasonXp: participant?.season_xp ?? null };
  }

  const now = Date.now();
  const seasonId = input.seasonId?.trim() || null;
  let participant: SeasonParticipantRow | null = null;
  if (seasonId) {
    const season = await getSeason(db, seasonId);
    if (!season) throw new Error("Season not found.");
    if (!isSeasonOpen(season, now)) throw new Error("Season is not currently active.");
    participant = await getSeasonParticipant(db, seasonId, input.userId);
    if (!participant) throw new Error("User has not joined this season.");
    if (participant.status !== "active") throw new Error("Season participant is not active.");
  }

  const ownership = await getGenesisOwnership(db, input.userId);
  const boostType = input.boostType ?? "xp";
  const boostPercent = boostType === "referral"
    ? ownership?.referral_boost_percent ?? 0
    : boostType === "xp" ? ownership?.xp_boost_percent ?? 0 : 0;
  const boostXp = Math.floor((input.baseXp * boostPercent) / 100);
  const totalXp = input.baseXp + boostXp;
  const multiplierBps = 10000 + boostPercent * 100;
  const transactionId = crypto.randomUUID();

  const statements = [
    db.prepare(
      `INSERT INTO xp_transactions (id, user_id, season_id, source_type, source_id, base_xp, boost_xp, total_xp, multiplier_bps, reason, status, idempotency_key, created_at, reversed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, NULL)`,
    ).bind(transactionId, input.userId, seasonId, input.sourceType, input.sourceId ?? null, input.baseXp, boostXp, totalXp, multiplierBps, input.reason ?? null, idempotencyKey, now),
    db.prepare(
      `INSERT INTO xp_balances (user_id, lifetime_xp, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET lifetime_xp = xp_balances.lifetime_xp + excluded.lifetime_xp, updated_at = excluded.updated_at`,
    ).bind(input.userId, totalXp, now),
  ];
  if (seasonId) {
    statements.push(db.prepare(
      `UPDATE season_participants SET season_xp = season_xp + ?, last_active_at = ?, updated_at = ?
       WHERE season_id = ? AND user_id = ? AND status = 'active'`,
    ).bind(totalXp, now, now, seasonId, input.userId));
  }

  try {
    await db.batch(statements);
  } catch (error) {
    const racedTransaction = await getXpTransactionByIdempotencyKey(db, idempotencyKey);
    if (!racedTransaction) throw error;
    if (racedTransaction.user_id !== input.userId) throw new Error("XP idempotency key belongs to another user.");
    const [racedBalance, racedParticipant] = await Promise.all([
      getXpBalance(db, input.userId),
      racedTransaction.season_id ? getSeasonParticipant(db, racedTransaction.season_id, input.userId) : Promise.resolve(null),
    ]);
    return { created: false, transaction: racedTransaction, lifetimeXp: racedBalance?.lifetime_xp ?? 0, seasonXp: racedParticipant?.season_xp ?? null };
  }

  const [transaction, balance, updatedParticipant] = await Promise.all([
    getXpTransactionByIdempotencyKey(db, idempotencyKey),
    getXpBalance(db, input.userId),
    seasonId ? getSeasonParticipant(db, seasonId, input.userId) : Promise.resolve(null),
  ]);
  if (!transaction || !balance) throw new Error("XP award was written but could not be read back.");
  return { created: true, transaction, lifetimeXp: balance.lifetime_xp, seasonXp: updatedParticipant?.season_xp ?? null };
}


// =========================================================
// INTEGRATED PARTICIPATION LAYER (0010-0017)
// =========================================================
type TrustedActivityTrustLevel = "backend" | "onchain" | "admin" | "system";
type TrustedActivitySourceType = "mission" | "referral" | "genesis" | "onchain" | "campaign" | "admin" | "system";
interface ProgressionLevelRow { id:string; key:string; name:string; description:string|null; min_lifetime_xp:number; sort_order:number; icon_key:string|null; benefits_config:string|null; }
interface ReferralQualityRuleSetRow { id:string; season_id:string|null; key:string; name:string; version:number; status:string; starts_at:number|null; ends_at:number|null; }
interface ReferralQualityStageRuleRow { id:string; rule_set_id:string; stage:"activated"|"engaged"|"qualified"; min_verified_missions:number; min_lifetime_xp:number; min_season_xp:number; min_genesis_balance:number; min_account_age_seconds:number; requirements_config:string|null; reward_base_xp:number; sort_order:number; }
function safeJsonParse(value:string|null):unknown|null { if(!value)return null; try{return JSON.parse(value);}catch{return null;} }
async function recordTrustedActivity(db:D1Database,input:{userId:string;seasonId?:string|null;eventType:string;sourceType:TrustedActivitySourceType;sourceId?:string|null;trustLevel:TrustedActivityTrustLevel;occurredAt?:number;idempotencyKey:string;evidence?:unknown;metadata?:unknown;}):Promise<string>{
  const existing=await db.prepare("SELECT id FROM trusted_activity_events WHERE idempotency_key = ? LIMIT 1").bind(input.idempotencyKey).first<{id:string}>(); if(existing)return existing.id;
  const id=crypto.randomUUID(),now=Date.now();
  try{await db.prepare("INSERT INTO trusted_activity_events (id,user_id,season_id,event_type,source_type,source_id,trust_level,occurred_at,idempotency_key,evidence,metadata,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,input.userId,input.seasonId??null,input.eventType,input.sourceType,input.sourceId??null,input.trustLevel,input.occurredAt??now,input.idempotencyKey,input.evidence===undefined?null:JSON.stringify(input.evidence),input.metadata===undefined?null:JSON.stringify(input.metadata),now).run();return id;}catch(error){const raced=await db.prepare("SELECT id FROM trusted_activity_events WHERE idempotency_key = ? LIMIT 1").bind(input.idempotencyKey).first<{id:string}>();if(raced)return raced.id;throw error;}
}
async function getProgressionSnapshot(db:D1Database,userId:string){
  const balance=await getXpBalance(db,userId),xp=balance?.lifetime_xp??0;
  const levels=(await db.prepare("SELECT id,key,name,description,min_lifetime_xp,sort_order,icon_key,benefits_config FROM progression_levels WHERE status='active' ORDER BY min_lifetime_xp ASC,sort_order ASC").all<ProgressionLevelRow>()).results??[];
  let current:ProgressionLevelRow|null=null,next:ProgressionLevelRow|null=null;
  for(const level of levels){if(level.min_lifetime_xp<=xp)current=level;else{next=level;break;}}
  if(!current&&levels.length>0)current=levels[0];

  const currentFloor=current?.min_lifetime_xp??0;
  const nextTarget=next?.min_lifetime_xp??currentFloor;
  const xpIntoCurrentLevel=Math.max(0,xp-currentFloor);
  const levelXpSpan=next?Math.max(1,nextTarget-currentFloor):0;
  const xpToNextLevel=next?Math.max(0,nextTarget-xp):0;
  const progressPercent=next?Math.max(0,Math.min(100,Math.floor((xpIntoCurrentLevel/levelXpSpan)*100))):100;
  const currentLevelIndex=current?levels.findIndex((level)=>level.id===current!.id):-1;

  const [milestones,achievements,streaks]=await Promise.all([
    db.prepare("SELECT u.id,u.milestone_id,u.season_id,u.achieved_value,u.unlocked_at,m.key,m.name,m.metric_type,m.target_value FROM user_milestone_unlocks u JOIN progression_milestones m ON m.id=u.milestone_id WHERE u.user_id=? AND u.status='unlocked' ORDER BY u.unlocked_at DESC LIMIT 50").bind(userId).all(),
    db.prepare("SELECT ua.id,ua.season_id,ua.earned_at,a.key,a.name,a.category,a.rarity,a.icon_key FROM user_achievements ua JOIN achievements a ON a.id=ua.achievement_id WHERE ua.user_id=? AND ua.status='earned' ORDER BY ua.earned_at DESC LIMIT 50").bind(userId).all(),
    db.prepare("SELECT streak_type,current_count,best_count,last_period_key,last_qualified_at,freeze_count,metadata,updated_at FROM user_streaks WHERE user_id=? ORDER BY current_count DESC").bind(userId).all()
  ]);

  return {
    lifetimeXp:xp,
    currentLevel:current?{
      id:current.id,key:current.key,name:current.name,description:current.description,
      minLifetimeXp:current.min_lifetime_xp,iconKey:current.icon_key,
      benefitsConfig:safeJsonParse(current.benefits_config),
      index:currentLevelIndex>=0?currentLevelIndex:0
    }:null,
    nextLevel:next?{
      id:next.id,key:next.key,name:next.name,description:next.description,
      minLifetimeXp:next.min_lifetime_xp,iconKey:next.icon_key,
      benefitsConfig:safeJsonParse(next.benefits_config),
      index:levels.findIndex((level)=>level.id===next!.id)
    }:null,
    progress:{
      xpIntoCurrentLevel,
      levelXpSpan,
      xpToNextLevel,
      progressPercent,
      currentLevelFloor:currentFloor,
      nextLevelTarget:next?nextTarget:null,
      isMaxLevel:!next&&current!==null
    },
    levels:levels.map((level,index)=>({
      id:level.id,key:level.key,name:level.name,description:level.description,
      minLifetimeXp:level.min_lifetime_xp,sortOrder:level.sort_order,iconKey:level.icon_key,
      benefitsConfig:safeJsonParse(level.benefits_config),index,
      status:level.min_lifetime_xp<=xp?'reached':next?.id===level.id?'next':'locked'
    })),
    xpToNextLevel,
    milestones:milestones.results??[],achievements:achievements.results??[],streaks:streaks.results??[]
  };
}
async function getNextMoveSnapshot(db:D1Database,userId:string){
  const now=Date.now();
  const [season,balance,genesis,referralCounts]=await Promise.all([
    getCurrentSeason(db),
    getXpBalance(db,userId),
    getGenesisOwnership(db,userId),
    db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='activated' THEN 1 ELSE 0 END) AS activated, SUM(CASE WHEN status='engaged' THEN 1 ELSE 0 END) AS engaged, SUM(CASE WHEN status='qualified' THEN 1 ELSE 0 END) AS qualified FROM referral_relationships WHERE referrer_user_id=? AND status!='blocked'").bind(userId).first<{total:number;activated:number;engaged:number;qualified:number}>()
  ]);
  const lifetimeXp=balance?.lifetime_xp??0;
  const participant=season?await getSeasonParticipant(db,season.id,userId):null;

  if(season&&isSeasonOpen(season,now)&&(!participant||participant.status!=='active')){
    return {key:'join_season',category:'season',title:`Join ${season.name}`,description:'Enter the current season so your verified activity can count toward seasonal progress.',ctaLabel:'Join season',href:'/app/season',priority:100,reason:'current_season_not_joined',verification:'backend'};
  }

  const activeMission=await db.prepare(`SELECT m.id,m.slug,m.name,m.description,m.base_xp,m.season_id
    FROM missions m
    WHERE m.status='active'
      AND (m.starts_at IS NULL OR m.starts_at<=?)
      AND (m.ends_at IS NULL OR m.ends_at>?)
      AND (m.season_id IS NULL OR m.season_id=?)
      AND NOT EXISTS (
        SELECT 1 FROM mission_completions mc
        WHERE mc.mission_id=m.id AND mc.user_id=? AND mc.status='rewarded'
          AND (m.repeat_type!='once' OR mc.period_key='once')
      )
    ORDER BY m.sort_order ASC,m.created_at ASC LIMIT 1`).bind(now,now,season?.id??null,userId).first<{id:string;slug:string;name:string;description:string|null;base_xp:number;season_id:string|null}>();
  if(activeMission){
    return {key:'complete_mission',category:'mission',title:activeMission.name,description:activeMission.description??'Complete your next verified mission to keep building your participation history.',ctaLabel:'Continue mission',href:'/app/season',priority:90,reason:'verified_mission_available',verification:'backend',mission:{id:activeMission.id,slug:activeMission.slug,baseXp:activeMission.base_xp}};
  }

  const totalReferrals=referralCounts?.total??0;
  if(totalReferrals===0){
    return {key:'invite_first_participant',category:'referral',title:'Invite your first participant',description:'Start building your network. Referral rewards grow when invited users become genuinely active.',ctaLabel:'Open referrals',href:'/app/referrals',priority:70,reason:'no_referrals_yet',verification:'backend'};
  }

  if((referralCounts?.qualified??0)===0){
    return {key:'grow_network_quality',category:'referral',title:'Grow your referral network',description:'Your network has started. Bring in another real participant while existing referrals progress through quality stages.',ctaLabel:'View referrals',href:'/app/referrals',priority:65,reason:'network_started_no_qualified_referral',verification:'backend',network:{total:totalReferrals,activated:referralCounts?.activated??0,engaged:referralCounts?.engaged??0,qualified:referralCounts?.qualified??0}};
  }

  if(!genesis||genesis.balance<=0){
    return {key:'discover_genesis',category:'genesis',title:'Explore Genesis membership',description:'You have established activity. Review Genesis membership when you are ready for progression and referral boosts.',ctaLabel:'Explore Genesis',href:'/app/genesis',priority:50,reason:'established_user_without_genesis',verification:'onchain',optional:true};
  }

  return {key:'build_verified_activity',category:'progression',title:'Build your verified activity',description:'Keep progressing through verified missions and real ecosystem activity as new opportunities become available.',ctaLabel:'View season',href:'/app/season',priority:40,reason:'core_actions_currently_complete',verification:'backend',context:{lifetimeXp,genesisBalance:genesis.balance,totalReferrals}};
}
async function getSeasonRankSnapshot(db:D1Database,userId:string,seasonId:string){const me=await getSeasonParticipant(db,seasonId,userId);if(!me)return null;const higher=await db.prepare("SELECT COUNT(*) AS count FROM season_participants WHERE season_id=? AND status='active' AND (season_xp>? OR (season_xp=? AND (joined_at<? OR (joined_at=? AND user_id<?))))").bind(seasonId,me.season_xp,me.season_xp,me.joined_at,me.joined_at,userId).first<CountRow>();return {rank:(higher?.count??0)+1,seasonXp:me.season_xp};}
async function evaluateReferralQuality(db:D1Database,referredUserId:string,seasonId:string|null){
  const relationship=await getReferralRelationshipByReferredUser(db,referredUserId);if(!relationship||relationship.status==='blocked'||relationship.status==='qualified')return {changed:false,relationship};const now=Date.now();
  let ruleSet=await db.prepare("SELECT id,season_id,key,name,version,status,starts_at,ends_at FROM referral_quality_rule_sets WHERE status='active' AND season_id IS ? AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>?) ORDER BY version DESC LIMIT 1").bind(seasonId,now,now).first<ReferralQualityRuleSetRow>();
  if(!ruleSet&&seasonId!==null)ruleSet=await db.prepare("SELECT id,season_id,key,name,version,status,starts_at,ends_at FROM referral_quality_rule_sets WHERE status='active' AND season_id IS NULL AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>?) ORDER BY version DESC LIMIT 1").bind(now,now).first<ReferralQualityRuleSetRow>();if(!ruleSet)return {changed:false,relationship,reason:'no_active_rule_set'};
  const rules=(await db.prepare("SELECT id,rule_set_id,stage,min_verified_missions,min_lifetime_xp,min_season_xp,min_genesis_balance,min_account_age_seconds,requirements_config,reward_base_xp,sort_order FROM referral_quality_stage_rules WHERE rule_set_id=? ORDER BY sort_order ASC").bind(ruleSet.id).all<ReferralQualityStageRuleRow>()).results??[];
  const order:ReferralStage[]=['joined','activated','engaged','qualified'];let currentIndex=order.indexOf(relationship.status);const transitions:unknown[]=[];
  for(const rule of rules){const targetIndex=order.indexOf(rule.stage);if(targetIndex<=currentIndex)continue;const [missions,balance,ownership,user,participant]=await Promise.all([db.prepare("SELECT COUNT(*) AS count FROM mission_completions WHERE user_id=? AND status='rewarded' AND (? IS NULL OR season_id=?)").bind(referredUserId,seasonId,seasonId).first<CountRow>(),getXpBalance(db,referredUserId),getGenesisOwnership(db,referredUserId),db.prepare("SELECT created_at FROM users WHERE id=? LIMIT 1").bind(referredUserId).first<{created_at:number}>(),seasonId?getSeasonParticipant(db,seasonId,referredUserId):Promise.resolve(null)]);const evidence={verifiedMissions:missions?.count??0,lifetimeXp:balance?.lifetime_xp??0,seasonXp:participant?.season_xp??0,genesisBalance:ownership?.balance??0,accountAgeSeconds:user?Math.max(0,Math.floor((now-user.created_at)/1000)):0};const passed=evidence.verifiedMissions>=rule.min_verified_missions&&evidence.lifetimeXp>=rule.min_lifetime_xp&&evidence.seasonXp>=rule.min_season_xp&&evidence.genesisBalance>=rule.min_genesis_balance&&evidence.accountAgeSeconds>=rule.min_account_age_seconds;
    await db.prepare("INSERT INTO referral_quality_evaluations (id,referral_id,rule_set_id,stage,result,evidence,evaluated_at,idempotency_key) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO UPDATE SET result=excluded.result,evidence=excluded.evidence,evaluated_at=excluded.evaluated_at").bind(crypto.randomUUID(),relationship.id,ruleSet.id,rule.stage,passed?'passed':'failed',JSON.stringify(evidence),now,`refq:${relationship.id}:${ruleSet.id}:${rule.stage}`).run();if(!passed)break;
    const tsColumn=rule.stage==='activated'?'activated_at':rule.stage==='engaged'?'engaged_at':'qualified_at';await db.prepare(`UPDATE referral_relationships SET status=?, ${tsColumn}=COALESCE(${tsColumn},?), updated_at=? WHERE id=? AND status<>'blocked'`).bind(rule.stage,now,now,relationship.id).run();
    await db.prepare("INSERT OR IGNORE INTO referral_events (id,referral_id,referrer_user_id,referred_user_id,event_type,stage,source_type,source_id,season_id,idempotency_key,metadata,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),relationship.id,relationship.referrer_user_id,relationship.referred_user_id,rule.stage,rule.stage,'system',rule.id,seasonId,`refstage:${relationship.id}:${rule.stage}`,JSON.stringify({ruleSetId:ruleSet.id,evidence}),now).run();
    if(rule.reward_base_xp>0){let rewardSeasonId:string|null=null;if(seasonId){const referrerParticipant=await getSeasonParticipant(db,seasonId,relationship.referrer_user_id);if(referrerParticipant?.status==='active')rewardSeasonId=seasonId;}await awardXp(db,{userId:relationship.referrer_user_id,sourceType:'referral',sourceId:relationship.id,seasonId:rewardSeasonId,baseXp:rule.reward_base_xp,reason:`Referral reached ${rule.stage}`,idempotencyKey:`refxp:${relationship.id}:${ruleSet.id}:${rule.stage}`,boostType:'referral'});}transitions.push({stage:rule.stage,evidence,rewardBaseXp:rule.reward_base_xp});currentIndex=targetIndex;
  }
  return {changed:transitions.length>0,relationship:await getReferralRelationshipByReferredUser(db,referredUserId),transitions,ruleSet:{id:ruleSet.id,key:ruleSet.key,version:ruleSet.version}};
}
async function processMissionParticipation(db:D1Database,mission:MissionRow,userId:string,completion:MissionCompletionRow,trustLevel:TrustedActivityTrustLevel="admin"){const activityId=await recordTrustedActivity(db,{userId,seasonId:mission.season_id,eventType:'mission_completed',sourceType:'mission',sourceId:mission.id,trustLevel,occurredAt:completion.rewarded_at??Date.now(),idempotencyKey:`activity:mission:${completion.id}`,evidence:{completionId:completion.id,xpTransactionId:completion.xp_transaction_id}});return {activityId,referral:await evaluateReferralQuality(db,userId,mission.season_id)};}
async function writeAdminAudit(db:D1Database,adminUserId:string,action:string,targetType:string,targetId:string|null,reason:string|null,newValue:unknown,requestId:string|null){await db.prepare("INSERT INTO admin_audit_log (id,admin_user_id,action,target_type,target_id,reason,old_value,new_value,request_id,created_at) VALUES (?,?,?,?,?,?,NULL,?,?,?)").bind(crypto.randomUUID(),adminUserId,action,targetType,targetId,reason,newValue===undefined?null:JSON.stringify(newValue),requestId,Date.now()).run();}

export default {

  async fetch(

    request: Request,

    env: Env,

    _ctx: ExecutionContext,

  ): Promise<Response> {

    const url = new URL(request.url);



    // =========================================================

    // CORS PREFLIGHT

    // =========================================================



    if (request.method === "OPTIONS") {

      return optionsResponse(request);

    }



    // =========================================================

    // API HOME

    // =========================================================



    if (request.method === "GET" && url.pathname === "/") {

      return jsonResponse(request, {

        success: true,

        project: "Unlimited X Labs",

        service: "API",

        message: "Unlimited X Labs API is running.",

      });

    }



    // =========================================================

    // HEALTH CHECK

    // =========================================================



    if (request.method === "GET" && url.pathname === "/health") {

      try {

        const result = await env.DB.prepare(

          "SELECT COUNT(*) AS user_count FROM users",

        ).first<{ user_count: number }>();



        return jsonResponse(request, {

          success: true,

          status: "ok",

          service: "unlimited-x-labs-api",

          database: {

            connected: true,

            userCount: result?.user_count ?? 0,

          },

        });

      } catch (error) {

        console.error("Health check failed:", error);



        return jsonResponse(

          request,

          {

            success: false,

            status: "error",

            service: "unlimited-x-labs-api",

            database: {

              connected: false,

            },

          },

          500,

        );

      }

    }



    // =========================================================

    // AUTH CHALLENGE

    // =========================================================



    if (

      request.method === "POST" &&

      url.pathname === "/auth/challenge"

    ) {

      try {

        let body: unknown;



        try {

          body = await request.json();

        } catch {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid JSON body.",

            },

            400,

          );

        }



        if (

          typeof body !== "object" ||

          body === null ||

          !("address" in body) ||

          typeof body.address !== "string"

        ) {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Wallet address is required.",

            },

            400,

          );

        }



        const suppliedAddress = body.address.trim();



        if (!isAddress(suppliedAddress)) {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid EVM wallet address.",

            },

            400,

          );

        }



        const checksumAddress = getAddress(suppliedAddress);

        const normalizedAddress = checksumAddress.toLowerCase();



        const now = Date.now();

        const expiresAt =

          now + AUTH_CHALLENGE_TTL_SECONDS * 1000;



        const challengeId = crypto.randomUUID();

        const nonce = generateNonce();



        const message = buildAuthMessage({

          address: checksumAddress,

          nonce,

          issuedAt: now,

          expiresAt,

        });



        await env.DB.prepare(

          `

          UPDATE auth_nonces

          SET status = 'expired'

          WHERE wallet_address = ?

            AND chain_id = ?

            AND status = 'pending'

          `,

        )

          .bind(normalizedAddress, AUTH_CHAIN_ID)

          .run();



        await env.DB.prepare(

          `

          INSERT INTO auth_nonces (

            id,

            wallet_address,

            chain_id,

            nonce,

            message,

            status,

            created_at,

            expires_at,

            used_at

          )

          VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, NULL)

          `,

        )

          .bind(

            challengeId,

            normalizedAddress,

            AUTH_CHAIN_ID,

            nonce,

            message,

            now,

            expiresAt,

          )

          .run();



        return jsonResponse(request, {

          success: true,

          challenge: {

            id: challengeId,

            address: checksumAddress,

            chainId: AUTH_CHAIN_ID,

            message,

            expiresAt,

          },

        });

      } catch (error) {

        console.error("Auth challenge failed:", error);



        return jsonResponse(

          request,

          {

            success: false,

            error:

              "Unable to create authentication challenge.",

          },

          500,

        );

      }

    }



    // =========================================================

    // AUTH VERIFY

    //

    // Verifies wallet ownership, consumes the one-time challenge,

    // creates or finds the Unlimited X Labs identity, and creates

    // an authenticated session.

    // =========================================================



    if (

      request.method === "POST" &&

      url.pathname === "/auth/verify"

    ) {

      try {

        let body: unknown;



        try {

          body = await request.json();

        } catch {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid JSON body.",

            },

            400,

          );

        }



        if (

          typeof body !== "object" ||

          body === null ||

          !("challengeId" in body) ||

          typeof body.challengeId !== "string" ||

          !("signature" in body) ||

          typeof body.signature !== "string"

        ) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Challenge ID and signature are required.",

            },

            400,

          );

        }



        const challengeId = body.challengeId.trim();

        const signature = body.signature.trim();



        if (

          !/^0x[0-9a-fA-F]+$/.test(signature) ||

          signature.length !== 132

        ) {

          return jsonResponse(

            request,

            {

              success: false,

              error: "Invalid wallet signature.",

            },

            400,

          );

        }



        const challenge = await env.DB.prepare(

          `

          SELECT

            id,

            wallet_address,

            chain_id,

            nonce,

            message,

            status,

            created_at,

            expires_at,

            used_at

          FROM auth_nonces

          WHERE id = ?

          LIMIT 1

          `,

        )

          .bind(challengeId)

          .first<AuthChallengeRow>();



        if (!challenge) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge not found.",

            },

            404,

          );

        }



        if (challenge.chain_id !== AUTH_CHAIN_ID) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Unsupported authentication chain.",

            },

            400,

          );

        }



        if (challenge.status !== "pending") {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge has already been used or expired.",

            },

            409,

          );

        }



        const now = Date.now();



        if (challenge.expires_at <= now) {

          await env.DB.prepare(

            `

            UPDATE auth_nonces

            SET status = 'expired'

            WHERE id = ?

              AND status = 'pending'

            `,

          )

            .bind(challenge.id)

            .run();



          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge has expired.",

            },

            410,

          );

        }



        const walletAddress = getAddress(

          challenge.wallet_address,

        );



        let signatureValid = false;



        try {

          signatureValid = await verifyMessage({

            address: walletAddress,

            message: challenge.message,

            signature: signature as Hex,

          });

        } catch {

          signatureValid = false;

        }



        if (!signatureValid) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Wallet signature verification failed.",

            },

            401,

          );

        }



        // Consume the challenge atomically.

        // Only one request can change pending -> used.

        const consumeResult = await env.DB.prepare(

          `

          UPDATE auth_nonces

          SET

            status = 'used',

            used_at = ?

          WHERE id = ?

            AND status = 'pending'

            AND expires_at > ?

          `,

        )

          .bind(now, challenge.id, now)

          .run();



        if (consumeResult.meta.changes !== 1) {

          return jsonResponse(

            request,

            {

              success: false,

              error:

                "Authentication challenge is no longer valid.",

            },

            409,

          );

        }



        const normalizedAddress =

          challenge.wallet_address.toLowerCase();



        let wallet = await env.DB.prepare(

          `

          SELECT

            id,

            user_id,

            address,

            chain_id,

            is_primary,

            status,

            connected_at,

            last_seen_at

          FROM wallets

          WHERE address = ?

            AND chain_id = ?

          LIMIT 1

          `,

        )

          .bind(normalizedAddress, AUTH_CHAIN_ID)

          .first<WalletRow>();



        let user: UserRow | null = null;

        let isNewUser = false;



        if (wallet) {

          if (wallet.status === "blocked") {

            return jsonResponse(

              request,

              {

                success: false,

                error: "This wallet is blocked.",

              },

              403,

            );

          }



          user = await env.DB.prepare(

            `

            SELECT

              id,

              username,

              referral_code,

              referred_by_user_id,

              country,

              status,

              created_at,

              last_active_at

            FROM users

            WHERE id = ?

            LIMIT 1

            `,

          )

            .bind(wallet.user_id)

            .first<UserRow>();



          if (!user) {

            throw new Error(

              "Wallet is linked to a missing user identity.",

            );

          }



          if (user.status !== "active") {

            return jsonResponse(

              request,

              {

                success: false,

                error: "This account is not active.",

              },

              403,

            );

          }



          await env.DB.batch([

            env.DB.prepare(

              `

              UPDATE users

              SET last_active_at = ?

              WHERE id = ?

              `,

            ).bind(now, user.id),



            env.DB.prepare(

              `

              UPDATE wallets

              SET

                last_seen_at = ?,

                status = 'active'

              WHERE id = ?

              `,

            ).bind(now, wallet.id),

          ]);



          user.last_active_at = now;

          wallet.last_seen_at = now;

          wallet.status = "active";

        } else {

          isNewUser = true;



          const userId = crypto.randomUUID();

          const walletId = crypto.randomUUID();

          const referralCode =

            await createUniqueReferralCode(env.DB);



          await env.DB.batch([

            env.DB.prepare(

              `

              INSERT INTO users (

                id,

                username,

                referral_code,

                referred_by_user_id,

                country,

                status,

                created_at,

                last_active_at

              )

              VALUES (?, NULL, ?, NULL, NULL, 'active', ?, ?)

              `,

            ).bind(

              userId,

              referralCode,

              now,

              now,

            ),



            env.DB.prepare(

              `

              INSERT INTO wallets (

                id,

                user_id,

                address,

                chain_id,

                is_primary,

                status,

                connected_at,

                last_seen_at

              )

              VALUES (?, ?, ?, ?, 1, 'active', ?, ?)

              `,

            ).bind(

              walletId,

              userId,

              normalizedAddress,

              AUTH_CHAIN_ID,

              now,

              now,

            ),

          ]);



          user = {

            id: userId,

            username: null,

            referral_code: referralCode,

            referred_by_user_id: null,

            country: null,

            status: "active",

            created_at: now,

            last_active_at: now,

          };



          wallet = {

            id: walletId,

            user_id: userId,

            address: normalizedAddress,

            chain_id: AUTH_CHAIN_ID,

            is_primary: 1,

            status: "active",

            connected_at: now,

            last_seen_at: now,

          };

        }



        const sessionToken = generateSessionToken();

        const sessionTokenHash =

          await sha256(sessionToken);



        const sessionId = crypto.randomUUID();

        const sessionExpiresAt =

          now + AUTH_SESSION_TTL_SECONDS * 1000;



        await env.DB.prepare(

          `

          INSERT INTO auth_sessions (

            id,

            user_id,

            token_hash,

            status,

            created_at,

            expires_at,

            last_seen_at,

            revoked_at

          )

          VALUES (?, ?, ?, 'active', ?, ?, ?, NULL)

          `,

        )

          .bind(

            sessionId,

            user.id,

            sessionTokenHash,

            now,

            sessionExpiresAt,

            now,

          )

          .run();



        return jsonResponse(request, {

          success: true,

          authenticated: true,

          isNewUser,

          user: {

            id: user.id,

            username: user.username,

            referralCode: user.referral_code,

            country: user.country,

            status: user.status,

            createdAt: user.created_at,

          },

          wallet: {

            address: getAddress(wallet.address),

            chainId: wallet.chain_id,

            isPrimary: wallet.is_primary === 1,

          },

          session: {

            expiresAt: sessionExpiresAt,

          },

        }, 200, {

          "Set-Cookie": buildSessionCookie(

            request,

            sessionToken,

            AUTH_SESSION_TTL_SECONDS,

          ),

        });

      } catch (error) {

        console.error("Auth verification failed:", error);



        return jsonResponse(

          request,

          {

            success: false,

            error:

              "Unable to verify wallet authentication.",

          },

          500,

        );

      }

    }



    // =========================================================

    // AUTH ME

    // =========================================================

    if (request.method === "GET" && url.pathname === "/auth/me") {
      try {
        const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);

        if (!sessionToken) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const tokenHash = await sha256(sessionToken);
        const now = Date.now();

        const session = await env.DB.prepare(
          `
          SELECT id, user_id, token_hash, status, created_at,
                 expires_at, last_seen_at, revoked_at
          FROM auth_sessions
          WHERE token_hash = ?
          LIMIT 1
          `,
        )
          .bind(tokenHash)
          .first<AuthSessionRow>();

        if (!session || session.status !== "active") {
          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        if (session.expires_at <= now) {
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'expired'
             WHERE id = ? AND status = 'active'`,
          )
            .bind(session.id)
            .run();

          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        const user = await env.DB.prepare(
          `
          SELECT id, username, referral_code, referred_by_user_id,
                 country, status, created_at, last_active_at
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
        )
          .bind(session.user_id)
          .first<UserRow>();

        if (!user || user.status !== "active") {
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'revoked', revoked_at = ?
             WHERE id = ? AND status = 'active'`,
          )
            .bind(now, session.id)
            .run();

          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        const wallet = await env.DB.prepare(
          `
          SELECT id, user_id, address, chain_id, is_primary, status,
                 connected_at, last_seen_at
          FROM wallets
          WHERE user_id = ? AND is_primary = 1
          ORDER BY connected_at ASC
          LIMIT 1
          `,
        )
          .bind(user.id)
          .first<WalletRow>();

        if (!wallet || wallet.status === "blocked") {
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'revoked', revoked_at = ?
             WHERE id = ? AND status = 'active'`,
          )
            .bind(now, session.id)
            .run();

          return jsonResponse(
            request,
            { success: false, authenticated: false },
            401,
            { "Set-Cookie": buildExpiredSessionCookie(request) },
          );
        }

        await env.DB.batch([
          env.DB.prepare(
            `UPDATE auth_sessions SET last_seen_at = ? WHERE id = ?`,
          ).bind(now, session.id),
          env.DB.prepare(
            `UPDATE users SET last_active_at = ? WHERE id = ?`,
          ).bind(now, user.id),
          env.DB.prepare(
            `UPDATE wallets SET last_seen_at = ? WHERE id = ?`,
          ).bind(now, wallet.id),
        ]);

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          user: {
            id: user.id,
            username: user.username,
            referralCode: user.referral_code,
            country: user.country,
            status: user.status,
            createdAt: user.created_at,
          },
          wallet: {
            address: getAddress(wallet.address),
            chainId: wallet.chain_id,
            isPrimary: wallet.is_primary === 1,
          },
          session: {
            expiresAt: session.expires_at,
          },
        });
      } catch (error) {
        console.error("Auth session restore failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to restore authentication session." },
          500,
        );
      }
    }

    // =========================================================
    // ADMIN ANALYTICS
    // =========================================================

    if (request.method === "GET" && url.pathname === "/admin/overview") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin) {
          return jsonResponse(
            request,
            { success: false, authenticated: true, authorized: false },
            403,
          );
        }

        const now = Date.now();
        const startOfTodayUtc = new Date(now);
        startOfTodayUtc.setUTCHours(0, 0, 0, 0);
        const todayCutoff = startOfTodayUtc.getTime();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const [
          totalUsers,
          newUsersToday,
          newUsers7d,
          newUsers30d,
          activeUsers7d,
          activeUsers30d,
          totalWallets,
          genesisHolders,
          genesisPasses,
          tierDistributionResult,
        ] = await Promise.all([
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users`).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE created_at >= ?`)
            .bind(todayCutoff).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE created_at >= ?`)
            .bind(sevenDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE created_at >= ?`)
            .bind(thirtyDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE last_active_at >= ?`)
            .bind(sevenDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE last_active_at >= ?`)
            .bind(thirtyDaysAgo).first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM wallets WHERE status != 'blocked'`)
            .first<CountRow>(),
          env.DB.prepare(`SELECT COUNT(*) AS count FROM genesis_ownership WHERE balance > 0`)
            .first<CountRow>(),
          env.DB.prepare(`SELECT COALESCE(SUM(balance), 0) AS total FROM genesis_ownership WHERE balance > 0`)
            .first<SumRow>(),
          env.DB.prepare(
            `SELECT tier_key, tier_name, COUNT(*) AS holders, COALESCE(SUM(balance), 0) AS passes
             FROM genesis_ownership
             WHERE balance > 0
             GROUP BY tier_key, tier_name
             ORDER BY MIN(balance) ASC`,
          ).all<TierDistributionRow>(),
        ]);

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          authorized: true,
          admin: {
            role: admin.role,
          },
          generatedAt: now,
          periods: {
            todayTimezone: "UTC",
            sevenDays: "rolling",
            thirtyDays: "rolling",
          },
          users: {
            total: totalUsers?.count ?? 0,
            newToday: newUsersToday?.count ?? 0,
            new7d: newUsers7d?.count ?? 0,
            new30d: newUsers30d?.count ?? 0,
            active7d: activeUsers7d?.count ?? 0,
            active30d: activeUsers30d?.count ?? 0,
          },
          wallets: {
            total: totalWallets?.count ?? 0,
          },
          genesis: {
            holders: genesisHolders?.count ?? 0,
            passes: genesisPasses?.total ?? 0,
            tierDistribution: tierDistributionResult.results ?? [],
          },
        });
      } catch (error) {
        console.error("Admin overview failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to load admin overview." },
          500,
        );
      }
    }

    // =========================================================
    // ADMIN USERS & WALLET INTELLIGENCE
    // =========================================================

    if (request.method === "GET" && url.pathname === "/admin/users") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);
        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin) return jsonResponse(request, { success: false, authenticated: true, authorized: false }, 403);

        const search = (url.searchParams.get("search") || "").trim().toLowerCase();
        const tier = (url.searchParams.get("tier") || "").trim().toLowerCase();
        const status = (url.searchParams.get("status") || "").trim().toLowerCase();
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
        const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

        const conditions: string[] = ["w.is_primary = 1"];
        const bindings: Array<string | number> = [];
        if (search) {
          conditions.push("(LOWER(w.address) LIKE ? OR LOWER(COALESCE(u.username, '')) LIKE ?)");
          bindings.push(`%${search}%`, `%${search}%`);
        }
        if (tier) {
          if (tier === "none") conditions.push("COALESCE(g.balance, 0) = 0");
          else { conditions.push("LOWER(COALESCE(g.tier_key, 'none')) = ?"); bindings.push(tier); }
        }
        if (status) { conditions.push("LOWER(u.status) = ?"); bindings.push(status); }
        const where = conditions.join(" AND ");

        const countQuery = env.DB.prepare(`SELECT COUNT(*) AS count FROM users u JOIN wallets w ON w.user_id = u.id LEFT JOIN genesis_ownership g ON g.user_id = u.id WHERE ${where}`);
        const listQuery = env.DB.prepare(`SELECT u.id AS user_id, u.username, u.status AS user_status, u.created_at AS user_created_at, u.last_active_at, w.address AS wallet_address, w.status AS wallet_status, w.connected_at, w.last_seen_at AS wallet_last_seen_at, g.balance AS genesis_balance, g.tier_key, g.tier_name, g.synced_at AS genesis_synced_at FROM users u JOIN wallets w ON w.user_id = u.id LEFT JOIN genesis_ownership g ON g.user_id = u.id WHERE ${where} ORDER BY u.last_active_at DESC LIMIT ? OFFSET ?`);
        const countResult = await countQuery.bind(...bindings).first<CountRow>();
        const listResult = await listQuery.bind(...bindings, limit, offset).all<AdminWalletListRow>();

        return jsonResponse(request, {
          success: true, authenticated: true, authorized: true,
          admin: { role: admin.role }, total: countResult?.count ?? 0, limit, offset,
          users: (listResult.results ?? []).map((row) => ({
            userId: row.user_id, username: row.username, status: row.user_status,
            createdAt: row.user_created_at, lastActiveAt: row.last_active_at,
            wallet: { address: getAddress(row.wallet_address), status: row.wallet_status, connectedAt: row.connected_at, lastSeenAt: row.wallet_last_seen_at },
            genesis: { balance: row.genesis_balance ?? 0, tierKey: row.tier_key ?? "none", tierName: row.tier_name ?? "None", syncedAt: row.genesis_synced_at },
          })),
        });
      } catch (error) {
        console.error("Admin users failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to load admin users." }, 500);
      }
    }

    if (request.method === "GET" && url.pathname.startsWith("/admin/wallets/")) {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);
        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin) return jsonResponse(request, { success: false, authenticated: true, authorized: false }, 403);

        const rawAddress = decodeURIComponent(url.pathname.slice("/admin/wallets/".length));
        if (!isAddress(rawAddress)) return jsonResponse(request, { success: false, error: "Invalid wallet address." }, 400);
        const address = getAddress(rawAddress);
        const row = await env.DB.prepare(`SELECT u.id AS user_id, u.username, u.status AS user_status, u.created_at AS user_created_at, u.last_active_at, w.address AS wallet_address, w.status AS wallet_status, w.connected_at, w.last_seen_at AS wallet_last_seen_at, g.balance AS genesis_balance, g.tier_key, g.tier_name, g.synced_at AS genesis_synced_at FROM users u JOIN wallets w ON w.user_id = u.id LEFT JOIN genesis_ownership g ON g.user_id = u.id WHERE LOWER(w.address) = LOWER(?) LIMIT 1`).bind(address).first<AdminWalletListRow>();
        if (!row) return jsonResponse(request, { success: false, error: "Wallet not found." }, 404);
        if (!env.BNB_RPC_URL) return jsonResponse(request, { success: false, error: "BNB RPC is not configured." }, 503);

        const client = createPublicClient({ transport: http(env.BNB_RPC_URL) });
        const [bnb, usdt, btcb] = await Promise.all([
          client.getBalance({ address }),
          client.readContract({ address: ADMIN_USDT_TOKEN, abi: ADMIN_ERC20_BALANCE_ABI, functionName: "balanceOf", args: [address] }),
          client.readContract({ address: ADMIN_BTCB_TOKEN, abi: ADMIN_ERC20_BALANCE_ABI, functionName: "balanceOf", args: [address] }),
        ]);

        return jsonResponse(request, {
          success: true, authenticated: true, authorized: true,
          user: { userId: row.user_id, username: row.username, status: row.user_status, createdAt: row.user_created_at, lastActiveAt: row.last_active_at },
          wallet: { address, status: row.wallet_status, connectedAt: row.connected_at, lastSeenAt: row.wallet_last_seen_at },
          genesis: { balance: row.genesis_balance ?? 0, tierKey: row.tier_key ?? "none", tierName: row.tier_name ?? "None", syncedAt: row.genesis_synced_at },
          balances: {
            BNB: { raw: bnb.toString(), formatted: formatUnits(bnb, 18) },
            USDT: { raw: usdt.toString(), formatted: formatUnits(usdt, 18) },
            BTCB: { raw: btcb.toString(), formatted: formatUnits(btcb, 18) },
          },
          balanceSource: "BNB Chain wallet balances",
          generatedAt: Date.now(),
        });
      } catch (error) {
        console.error("Admin wallet detail failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to load wallet intelligence." }, 502);
      }
    }

    // =========================================================
    // ADMIN XP CONTROL
    // Super Admin only. Manual XP awards always pass through the
    // central XP engine so Genesis boosts and idempotency apply.
    // =========================================================

    if (request.method === "POST" && url.pathname === "/admin/xp/award") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin || admin.role !== "super_admin") {
          return jsonResponse(
            request,
            { success: false, authenticated: true, authorized: false },
            403,
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse(request, { success: false, error: "Invalid JSON body." }, 400);
        }

        if (typeof body !== "object" || body === null) {
          return jsonResponse(request, { success: false, error: "Invalid request body." }, 400);
        }

        const payload = body as Record<string, unknown>;
        const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";
        const baseXp = payload.baseXp;
        const reason = typeof payload.reason === "string" ? payload.reason.trim() : "";
        const idempotencyKey =
          typeof payload.idempotencyKey === "string" ? payload.idempotencyKey.trim() : "";
        const seasonId = typeof payload.seasonId === "string" ? payload.seasonId.trim() || null : null;

        if (!userId) {
          return jsonResponse(request, { success: false, error: "User ID is required." }, 400);
        }
        if (!Number.isSafeInteger(baseXp) || (baseXp as number) <= 0) {
          return jsonResponse(
            request,
            { success: false, error: "Base XP must be a positive safe integer." },
            400,
          );
        }
        if (!reason) {
          return jsonResponse(request, { success: false, error: "Award reason is required." }, 400);
        }
        if (!idempotencyKey) {
          return jsonResponse(
            request,
            { success: false, error: "Idempotency key is required." },
            400,
          );
        }

        const targetUser = await env.DB.prepare(
          `SELECT id, status FROM users WHERE id = ? LIMIT 1`,
        ).bind(userId).first<{ id: string; status: string }>();

        if (!targetUser) {
          return jsonResponse(request, { success: false, error: "Target user not found." }, 404);
        }
        if (targetUser.status !== "active") {
          return jsonResponse(
            request,
            { success: false, error: "XP cannot be awarded to an inactive user." },
            409,
          );
        }

        const result = await awardXp(env.DB, {
          userId,
          sourceType: "admin",
          sourceId: auth.user.id,
          baseXp: baseXp as number,
          reason,
          idempotencyKey,
          seasonId,
          boostType: "xp",
        });

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          authorized: true,
          admin: { role: admin.role },
          award: {
            created: result.created,
            lifetimeXp: result.lifetimeXp,
            seasonXp: result.seasonXp,
            transaction: serializeXpTransaction(result.transaction),
          },
        }, result.created ? 201 : 200);
      } catch (error) {
        console.error("Admin XP award failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to award XP." },
          500,
        );
      }
    }

    // =========================================================
    // SEASON CORE
    // =========================================================

    if (request.method === "GET" && url.pathname === "/season/current") {
      try {
        const season = await getCurrentSeason(env.DB);
        return jsonResponse(request, { success: true, season: season ? serializeSeason(season) : null });
      } catch (error) {
        console.error("Current season read failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to load current season." }, 500);
      }
    }

    if (request.method === "GET" && url.pathname === "/season/me") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);
        const season = await getCurrentSeason(env.DB);
        if (!season) return jsonResponse(request, { success: true, authenticated: true, season: null, participation: null });
        const participant = await getSeasonParticipant(env.DB, season.id, auth.user.id);
        return jsonResponse(request, { success: true, authenticated: true, season: serializeSeason(season), participation: participant ? serializeSeasonParticipant(participant) : null });
      } catch (error) {
        console.error("Season profile read failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to load season profile." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/season/join") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);
        const season = await getCurrentSeason(env.DB);
        const now = Date.now();
        if (!season) return jsonResponse(request, { success: false, error: "No current season is available." }, 404);
        if (!isSeasonOpen(season, now)) return jsonResponse(request, { success: false, error: "The current season is not open for participation." }, 409);
        const existing = await getSeasonParticipant(env.DB, season.id, auth.user.id);
        if (existing) {
          if (existing.status === "disqualified") return jsonResponse(request, { success: false, error: "This account is disqualified from the current season." }, 403);
          return jsonResponse(request, { success: true, authenticated: true, created: false, season: serializeSeason(season), participation: serializeSeasonParticipant(existing) });
        }
        const participantId = crypto.randomUUID();
        const insertResult = await env.DB.prepare(
          `INSERT INTO season_participants (id, season_id, user_id, status, season_xp, joined_at, last_active_at, updated_at)
           VALUES (?, ?, ?, 'active', 0, ?, ?, ?)
           ON CONFLICT(season_id, user_id) DO NOTHING`,
        ).bind(participantId, season.id, auth.user.id, now, now, now).run();
        const participant = await getSeasonParticipant(env.DB, season.id, auth.user.id);
        if (!participant) throw new Error("Season participation was written but could not be read back.");
        if (participant.status === "disqualified") return jsonResponse(request, { success: false, error: "This account is disqualified from the current season." }, 403);
        const created = insertResult.meta.changes > 0;
        return jsonResponse(request, { success: true, authenticated: true, created, season: serializeSeason(season), participation: serializeSeasonParticipant(participant) }, created ? 201 : 200);
      } catch (error) {
        console.error("Season join failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to join the current season." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/admin/seasons") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);
        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin || admin.role !== "super_admin") return jsonResponse(request, { success: false, authenticated: true, authorized: false }, 403);
        let body: unknown;
        try { body = await request.json(); } catch { return jsonResponse(request, { success: false, error: "Invalid JSON body." }, 400); }
        if (typeof body !== "object" || body === null) return jsonResponse(request, { success: false, error: "Invalid request body." }, 400);
        const payload = body as Record<string, unknown>;
        const slug = typeof payload.slug === "string" ? payload.slug.trim().toLowerCase() : "";
        const name = typeof payload.name === "string" ? payload.name.trim() : "";
        const description = typeof payload.description === "string" ? payload.description.trim() || null : null;
        const startsAt = typeof payload.startsAt === "number" && Number.isSafeInteger(payload.startsAt) ? payload.startsAt : null;
        const endsAt = typeof payload.endsAt === "number" && Number.isSafeInteger(payload.endsAt) ? payload.endsAt : null;
        if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return jsonResponse(request, { success: false, error: "A valid season slug is required." }, 400);
        if (!name) return jsonResponse(request, { success: false, error: "Season name is required." }, 400);
        if (startsAt !== null && endsAt !== null && endsAt <= startsAt) return jsonResponse(request, { success: false, error: "Season end must be after season start." }, 400);
        const now = Date.now();
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO seasons (id, slug, name, description, status, is_current, starts_at, ends_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'draft', 0, ?, ?, ?, ?)`,
        ).bind(id, slug, name, description, startsAt, endsAt, now, now).run();
        const season = await getSeason(env.DB, id);
        if (!season) throw new Error("Season was written but could not be read back.");
        return jsonResponse(request, { success: true, authenticated: true, authorized: true, season: serializeSeason(season) }, 201);
      } catch (error) {
        console.error("Admin season creation failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to create season." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname.startsWith("/admin/seasons/") && url.pathname.endsWith("/activate")) {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);
        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin || admin.role !== "super_admin") return jsonResponse(request, { success: false, authenticated: true, authorized: false }, 403);
        const seasonId = decodeURIComponent(url.pathname.slice("/admin/seasons/".length, -"/activate".length));
        const season = await getSeason(env.DB, seasonId);
        if (!season) return jsonResponse(request, { success: false, error: "Season not found." }, 404);
        const now = Date.now();
        if (season.ends_at !== null && season.ends_at <= now) return jsonResponse(request, { success: false, error: "An already-ended season cannot be activated." }, 409);
        await env.DB.batch([
          env.DB.prepare(`UPDATE seasons SET is_current = 0, status = CASE WHEN status = 'active' THEN 'ended' ELSE status END, updated_at = ? WHERE is_current = 1 AND id != ?`).bind(now, seasonId),
          env.DB.prepare(`UPDATE seasons SET status = 'active', is_current = 1, starts_at = COALESCE(starts_at, ?), updated_at = ? WHERE id = ?`).bind(now, now, seasonId),
        ]);
        const active = await getSeason(env.DB, seasonId);
        if (!active) throw new Error("Activated season could not be read back.");
        return jsonResponse(request, { success: true, authenticated: true, authorized: true, season: serializeSeason(active) });
      } catch (error) {
        console.error("Admin season activation failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to activate season." }, 500);
      }
    }

    // =========================================================
    // MISSION ENGINE
    // Read APIs + Super Admin mission management.
    // Completion/reward verification is intentionally NOT exposed
    // as a client-claim endpoint.
    // =========================================================

    if (request.method === "GET" && url.pathname === "/missions") {
      try {
        const season = await getCurrentSeason(env.DB);
        const now = Date.now();

        if (!season || !isSeasonOpen(season, now)) {
          return jsonResponse(request, {
            success: true,
            season: season ? serializeSeason(season) : null,
            missions: [],
          });
        }

        const result = await env.DB.prepare(
          `SELECT id, season_id, slug, name, description, category, verification_type,
                  base_xp, status, repeat_type, max_completions, verification_config,
                  sort_order, starts_at, ends_at, created_at, updated_at
           FROM missions
           WHERE season_id = ?
             AND status = 'active'
             AND (starts_at IS NULL OR starts_at <= ?)
             AND (ends_at IS NULL OR ends_at > ?)
           ORDER BY sort_order ASC, created_at ASC`,
        ).bind(season.id, now, now).all<MissionRow>();

        return jsonResponse(request, {
          success: true,
          season: serializeSeason(season),
          missions: (result.results ?? []).map((mission) => serializeMission(mission, now)),
        });
      } catch (error) {
        console.error("Mission list failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to load missions." }, 500);
      }
    }

    if (request.method === "GET" && url.pathname === "/missions/me") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const season = await getCurrentSeason(env.DB);
        const now = Date.now();

        if (!season) {
          return jsonResponse(request, {
            success: true,
            authenticated: true,
            season: null,
            participation: null,
            missions: [],
          });
        }

        const participant = await getSeasonParticipant(env.DB, season.id, auth.user.id);
        const missionResult = await env.DB.prepare(
          `SELECT id, season_id, slug, name, description, category, verification_type,
                  base_xp, status, repeat_type, max_completions, verification_config,
                  sort_order, starts_at, ends_at, created_at, updated_at
           FROM missions
           WHERE season_id = ?
             AND status = 'active'
             AND (starts_at IS NULL OR starts_at <= ?)
             AND (ends_at IS NULL OR ends_at > ?)
           ORDER BY sort_order ASC, created_at ASC`,
        ).bind(season.id, now, now).all<MissionRow>();

        const missions = missionResult.results ?? [];
        if (missions.length === 0) {
          return jsonResponse(request, {
            success: true,
            authenticated: true,
            season: serializeSeason(season),
            participation: participant ? serializeSeasonParticipant(participant) : null,
            missions: [],
          });
        }

        const [progressResult, completionResult, stepEvidenceResult] = await Promise.all([
          env.DB.prepare(
            `SELECT p.id, p.mission_id, p.user_id, p.status, p.progress_value,
                    p.target_value, p.completion_count, p.first_started_at,
                    p.last_progress_at, p.last_completed_at, p.created_at, p.updated_at
             FROM user_mission_progress p
             JOIN missions m ON m.id = p.mission_id
             WHERE p.user_id = ? AND m.season_id = ?`,
          ).bind(auth.user.id, season.id).all<UserMissionProgressRow>(),
          env.DB.prepare(
            `SELECT c.mission_id, COUNT(*) AS completion_count,
                    MAX(c.verified_at) AS last_completed_at
             FROM mission_completions c
             JOIN missions m ON m.id = c.mission_id
             WHERE c.user_id = ?
               AND m.season_id = ?
               AND c.status IN ('verified', 'rewarded')
             GROUP BY c.mission_id`,
          ).bind(auth.user.id, season.id).all<MissionCompletionSummaryRow>(),
          env.DB.prepare(
            `SELECT e.mission_id, e.user_id, e.step_key, e.recorded_at
             FROM mission_step_evidence e
             JOIN missions m ON m.id = e.mission_id
             WHERE e.user_id = ? AND m.season_id = ?
             ORDER BY e.recorded_at ASC`,
          ).bind(auth.user.id, season.id).all<MissionStepEvidenceRow>(),
        ]);

        const progressByMission = new Map(
          (progressResult.results ?? []).map((row) => [row.mission_id, row]),
        );
        const completionByMission = new Map(
          (completionResult.results ?? []).map((row) => [row.mission_id, row]),
        );
        const completedStepsByMission = new Map<string, string[]>();
        for (const row of stepEvidenceResult.results ?? []) {
          const current = completedStepsByMission.get(row.mission_id) ?? [];
          if (!current.includes(row.step_key)) current.push(row.step_key);
          completedStepsByMission.set(row.mission_id, current);
        }

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          season: serializeSeason(season),
          participation: participant ? serializeSeasonParticipant(participant) : null,
          missions: missions.map((mission) => {
            const progress = progressByMission.get(mission.id) ?? null;
            const completion = completionByMission.get(mission.id) ?? null;
            return {
              ...serializeMission(mission, now),
              progress: serializeMissionProgress(progress),
              completedSteps: completedStepsByMission.get(mission.id) ?? [],
              verifiedCompletionCount: completion?.completion_count ?? 0,
              lastVerifiedCompletionAt: completion?.last_completed_at ?? null,
            };
          }),
        });
      } catch (error) {
        console.error("Mission profile failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to load mission progress." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/admin/missions") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin || admin.role !== "super_admin") {
          return jsonResponse(
            request,
            { success: false, authenticated: true, authorized: false },
            403,
          );
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse(request, { success: false, error: "Invalid JSON body." }, 400);
        }

        if (typeof body !== "object" || body === null) {
          return jsonResponse(request, { success: false, error: "Invalid request body." }, 400);
        }

        const payload = body as Record<string, unknown>;
        const slug = typeof payload.slug === "string" ? payload.slug.trim().toLowerCase() : "";
        const name = typeof payload.name === "string" ? payload.name.trim() : "";
        const description =
          typeof payload.description === "string" ? payload.description.trim() || null : null;
        const category =
          typeof payload.category === "string" ? payload.category.trim().toLowerCase() : "";
        const verificationType =
          typeof payload.verificationType === "string"
            ? payload.verificationType.trim().toLowerCase()
            : "";
        const repeatType =
          typeof payload.repeatType === "string"
            ? payload.repeatType.trim().toLowerCase()
            : "once";
        const baseXp = payload.baseXp;
        const maxCompletions =
          payload.maxCompletions === null || payload.maxCompletions === undefined
            ? null
            : payload.maxCompletions;
        const sortOrder =
          payload.sortOrder === undefined
            ? 0
            : payload.sortOrder;
        const startsAt =
          payload.startsAt === null || payload.startsAt === undefined
            ? null
            : payload.startsAt;
        const endsAt =
          payload.endsAt === null || payload.endsAt === undefined
            ? null
            : payload.endsAt;
        const requestedSeasonId =
          typeof payload.seasonId === "string" ? payload.seasonId.trim() || null : null;

        if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
          return jsonResponse(request, { success: false, error: "A valid mission slug is required." }, 400);
        }
        if (!name) {
          return jsonResponse(request, { success: false, error: "Mission name is required." }, 400);
        }
        if (!MISSION_CATEGORIES.has(category as MissionCategory)) {
          return jsonResponse(request, { success: false, error: "Invalid mission category." }, 400);
        }
        if (!MISSION_VERIFICATION_TYPES.has(verificationType as MissionVerificationType)) {
          return jsonResponse(request, { success: false, error: "Invalid mission verification type." }, 400);
        }
        if (!MISSION_REPEAT_TYPES.has(repeatType as MissionRepeatType)) {
          return jsonResponse(request, { success: false, error: "Invalid mission repeat type." }, 400);
        }
        if (!Number.isSafeInteger(baseXp) || (baseXp as number) < 0) {
          return jsonResponse(request, { success: false, error: "Base XP must be a non-negative safe integer." }, 400);
        }
        if (
          maxCompletions !== null &&
          (!Number.isSafeInteger(maxCompletions) || (maxCompletions as number) <= 0)
        ) {
          return jsonResponse(request, { success: false, error: "Max completions must be a positive safe integer or null." }, 400);
        }
        if (repeatType === "once" && maxCompletions !== null && maxCompletions !== 1) {
          return jsonResponse(request, { success: false, error: "One-time missions can only have one completion." }, 400);
        }
        if (!Number.isSafeInteger(sortOrder)) {
          return jsonResponse(request, { success: false, error: "Sort order must be a safe integer." }, 400);
        }
        if (startsAt !== null && !Number.isSafeInteger(startsAt)) {
          return jsonResponse(request, { success: false, error: "Mission start time must be an integer timestamp or null." }, 400);
        }
        if (endsAt !== null && !Number.isSafeInteger(endsAt)) {
          return jsonResponse(request, { success: false, error: "Mission end time must be an integer timestamp or null." }, 400);
        }
        if (
          startsAt !== null &&
          endsAt !== null &&
          (endsAt as number) <= (startsAt as number)
        ) {
          return jsonResponse(request, { success: false, error: "Mission end must be after mission start." }, 400);
        }

        let season: SeasonRow | null = null;
        if (requestedSeasonId) {
          season = await getSeason(env.DB, requestedSeasonId);
          if (!season) {
            return jsonResponse(request, { success: false, error: "Season not found." }, 404);
          }
        } else {
          season = await getCurrentSeason(env.DB);
          if (!season) {
            return jsonResponse(
              request,
              { success: false, error: "No current season exists. Supply a seasonId." },
              409,
            );
          }
        }

        let verificationConfig: string | null = null;
        if (payload.verificationConfig !== undefined && payload.verificationConfig !== null) {
          if (
            typeof payload.verificationConfig !== "object" ||
            Array.isArray(payload.verificationConfig)
          ) {
            return jsonResponse(
              request,
              { success: false, error: "Verification config must be a JSON object or null." },
              400,
            );
          }
          verificationConfig = JSON.stringify(payload.verificationConfig);
        }

        const now = Date.now();
        const id = crypto.randomUUID();

        try {
          await env.DB.prepare(
            `INSERT INTO missions (
               id, season_id, slug, name, description, category, verification_type,
               base_xp, status, repeat_type, max_completions, verification_config,
               sort_order, starts_at, ends_at, created_at, updated_at
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            id,
            season.id,
            slug,
            name,
            description,
            category,
            verificationType,
            baseXp as number,
            repeatType,
            maxCompletions as number | null,
            verificationConfig,
            sortOrder as number,
            startsAt as number | null,
            endsAt as number | null,
            now,
            now,
          ).run();
        } catch (error) {
          const existing = await env.DB.prepare(
            `SELECT id FROM missions WHERE slug = ? LIMIT 1`,
          ).bind(slug).first<{ id: string }>();
          if (existing) {
            return jsonResponse(request, { success: false, error: "Mission slug already exists." }, 409);
          }
          throw error;
        }

        const mission = await getMission(env.DB, id);
        if (!mission) throw new Error("Mission was written but could not be read back.");

        return jsonResponse(
          request,
          {
            success: true,
            authenticated: true,
            authorized: true,
            admin: { role: admin.role },
            mission: serializeMission(mission, now),
          },
          201,
        );
      } catch (error) {
        console.error("Admin mission creation failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to create mission." }, 500);
      }
    }

    if (
      request.method === "POST" &&
      url.pathname.startsWith("/admin/missions/") &&
      url.pathname.endsWith("/activate")
    ) {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin || admin.role !== "super_admin") {
          return jsonResponse(
            request,
            { success: false, authenticated: true, authorized: false },
            403,
          );
        }

        const missionId = decodeURIComponent(
          url.pathname.slice("/admin/missions/".length, -"/activate".length),
        ).trim();

        if (!missionId) {
          return jsonResponse(request, { success: false, error: "Mission ID is required." }, 400);
        }

        const mission = await getMission(env.DB, missionId);
        if (!mission) {
          return jsonResponse(request, { success: false, error: "Mission not found." }, 404);
        }
        if (mission.status === "archived") {
          return jsonResponse(request, { success: false, error: "Archived missions cannot be activated." }, 409);
        }

        const now = Date.now();
        if (mission.ends_at !== null && mission.ends_at <= now) {
          return jsonResponse(request, { success: false, error: "An already-ended mission cannot be activated." }, 409);
        }

        if (mission.season_id) {
          const season = await getSeason(env.DB, mission.season_id);
          if (!season) {
            return jsonResponse(request, { success: false, error: "Mission season not found." }, 409);
          }
          if (!isSeasonOpen(season, now)) {
            return jsonResponse(
              request,
              { success: false, error: "Mission season must be the active current season." },
              409,
            );
          }
        }

        await env.DB.prepare(
          `UPDATE missions
           SET status = 'active',
               starts_at = COALESCE(starts_at, ?),
               updated_at = ?
           WHERE id = ?`,
        ).bind(now, now, mission.id).run();

        const active = await getMission(env.DB, mission.id);
        if (!active) throw new Error("Activated mission could not be read back.");

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          authorized: true,
          admin: { role: admin.role },
          mission: serializeMission(active, now),
        });
      } catch (error) {
        console.error("Admin mission activation failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to activate mission." }, 500);
      }
    }

    // =========================================================
    // APP-STEP MISSION PROGRESS
    // Authenticated users may record only server-configured app steps.
    // Step evidence never carries an XP amount or completion status.
    // The existing mission reward engine is invoked only after every
    // distinct configured step has been recorded.
    // =========================================================

    if (
      request.method === "POST" &&
      url.pathname.startsWith("/missions/") &&
      url.pathname.endsWith("/progress")
    ) {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);

        const missionId = decodeURIComponent(
          url.pathname.slice("/missions/".length, -"/progress".length),
        ).trim();
        if (!missionId) return jsonResponse(request, { success: false, error: "Mission ID is required." }, 400);

        const mission = await getMission(env.DB, missionId);
        if (!mission) return jsonResponse(request, { success: false, error: "Mission not found." }, 404);

        const now = Date.now();
        if (mission.status !== "active" || !isMissionScheduledNow(mission, now)) {
          return jsonResponse(request, { success: false, error: "Mission is not currently available." }, 409);
        }
        if (!mission.season_id) {
          return jsonResponse(request, { success: false, error: "Mission is not linked to a season." }, 409);
        }

        const season = await getSeason(env.DB, mission.season_id);
        if (!season || !isSeasonOpen(season, now)) {
          return jsonResponse(request, { success: false, error: "Mission season is not currently active." }, 409);
        }

        const participant = await getSeasonParticipant(env.DB, mission.season_id, auth.user.id);
        if (!participant || participant.status !== "active") {
          return jsonResponse(request, { success: false, error: "Join the active season before progressing this mission." }, 409);
        }

        const config = getAppStepsMissionConfig(mission);
        if (!config) {
          return jsonResponse(request, { success: false, error: "This mission does not accept app-step progress." }, 409);
        }

        let body: unknown;
        try { body = await request.json(); }
        catch { return jsonResponse(request, { success: false, error: "Invalid JSON body." }, 400); }

        if (typeof body !== "object" || body === null) {
          return jsonResponse(request, { success: false, error: "Invalid request body." }, 400);
        }

        const payload = body as Record<string, unknown>;
        const stepKey = typeof payload.stepKey === "string" ? payload.stepKey.trim().toLowerCase() : "";
        if (!stepKey || !config.requiredSteps.includes(stepKey)) {
          return jsonResponse(request, { success: false, error: "Step is not valid for this mission." }, 400);
        }

        await env.DB.prepare(
          `INSERT OR IGNORE INTO mission_step_evidence (
             id, mission_id, user_id, season_id, step_key, source_type, evidence, recorded_at, created_at
           ) VALUES (?, ?, ?, ?, ?, 'app', ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(), mission.id, auth.user.id, mission.season_id, stepKey,
          JSON.stringify({ kind: "authenticated_app_step" }), now, now,
        ).run();

        const evidenceResult = await env.DB.prepare(
          `SELECT mission_id, user_id, step_key, recorded_at
           FROM mission_step_evidence
           WHERE mission_id = ? AND user_id = ?
           ORDER BY recorded_at ASC`,
        ).bind(mission.id, auth.user.id).all<MissionStepEvidenceRow>();

        const completedSteps = config.requiredSteps.filter((requiredStep) =>
          (evidenceResult.results ?? []).some((row) => row.step_key === requiredStep),
        );
        const progressValue = completedSteps.length;
        const targetValue = config.requiredSteps.length;
        const complete = progressValue >= targetValue;

        if (!complete) {
          await env.DB.prepare(
            `INSERT INTO user_mission_progress (
               id, mission_id, user_id, status, progress_value, target_value,
               completion_count, first_started_at, last_progress_at,
               last_completed_at, created_at, updated_at
             ) VALUES (?, ?, ?, 'in_progress', ?, ?, 0, ?, ?, NULL, ?, ?)
             ON CONFLICT(mission_id, user_id) DO UPDATE SET
               status = CASE WHEN user_mission_progress.status = 'completed' THEN 'completed' ELSE 'in_progress' END,
               progress_value = MAX(user_mission_progress.progress_value, excluded.progress_value),
               target_value = excluded.target_value,
               first_started_at = COALESCE(user_mission_progress.first_started_at, excluded.first_started_at),
               last_progress_at = excluded.last_progress_at,
               updated_at = excluded.updated_at`,
          ).bind(
            crypto.randomUUID(), mission.id, auth.user.id, progressValue, targetValue,
            now, now, now, now,
          ).run();

          return jsonResponse(request, {
            success: true,
            authenticated: true,
            mission: serializeMission(mission, now),
            progress: {
              status: "in_progress",
              progressValue,
              targetValue,
              completedSteps,
              requiredSteps: config.requiredSteps,
            },
            completed: false,
            award: null,
          });
        }

        const result = await rewardVerifiedMissionCompletion(env.DB, mission, auth.user.id, {
          verificationData: {
            verifier: "system",
            mode: "app_steps",
            completedSteps,
          },
        });
        const participation = await processMissionParticipation(
          env.DB, mission, auth.user.id, result.completion, "system",
        );

        const completedAt = result.completion.rewarded_at ?? Date.now();
        await env.DB.prepare(
          `INSERT INTO user_mission_progress (
             id, mission_id, user_id, status, progress_value, target_value,
             completion_count, first_started_at, last_progress_at,
             last_completed_at, created_at, updated_at
           ) VALUES (?, ?, ?, 'completed', ?, ?, 1, ?, ?, ?, ?, ?)
           ON CONFLICT(mission_id, user_id) DO UPDATE SET
             status = 'completed',
             progress_value = excluded.progress_value,
             target_value = excluded.target_value,
             completion_count = (
               SELECT COUNT(*) FROM mission_completions
               WHERE mission_id = excluded.mission_id
                 AND user_id = excluded.user_id
                 AND status IN ('verified', 'rewarded')
             ),
             first_started_at = COALESCE(user_mission_progress.first_started_at, excluded.first_started_at),
             last_progress_at = excluded.last_progress_at,
             last_completed_at = COALESCE(user_mission_progress.last_completed_at, excluded.last_completed_at),
             updated_at = excluded.updated_at`,
        ).bind(
          crypto.randomUUID(), mission.id, auth.user.id, targetValue, targetValue,
          now, completedAt, completedAt, now, completedAt,
        ).run();

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          mission: serializeMission(mission, now),
          progress: {
            status: "completed",
            progressValue: targetValue,
            targetValue,
            completedSteps,
            requiredSteps: config.requiredSteps,
          },
          completed: true,
          completion: {
            id: result.completion.id,
            status: result.completion.status,
            rewardedAt: result.completion.rewarded_at,
          },
          award: {
            transactionId: result.award.transaction.id,
            baseXp: result.award.transaction.base_xp,
            boostXp: result.award.transaction.boost_xp,
            totalXp: result.award.transaction.total_xp,
            created: result.award.created,
          },
          participation,
        });
      } catch (error) {
        console.error("Mission app-step progress failed:", error);
        const message = error instanceof Error ? error.message : "Unable to record mission progress.";
        const expected = new Set([
          "Mission is not currently available.",
          "Mission is not linked to a season.",
          "Mission season is not currently active.",
          "User is not an active participant in this season.",
          "Mission completion limit has been reached.",
          "Mission completion is not rewardable.",
        ]);
        return jsonResponse(request, { success: false, error: expected.has(message) ? message : "Unable to record mission progress." }, expected.has(message) ? 409 : 500);
      }
    }

    // =========================================================
    // MISSION COMPLETION / TRUSTED VERIFICATION
    // Super Admin only in v2. No public client-claim endpoint.
    // =========================================================

    if (
      request.method === "POST" &&
      url.pathname.startsWith("/admin/missions/") &&
      url.pathname.endsWith("/complete")
    ) {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) return jsonResponse(request, { success: false, authenticated: false }, 401);

        const admin = await getActiveAdmin(env.DB, auth.user.id);
        if (!admin || admin.role !== "super_admin") {
          return jsonResponse(request, { success: false, authenticated: true, authorized: false }, 403);
        }

        const missionId = decodeURIComponent(
          url.pathname.slice("/admin/missions/".length, -"/complete".length),
        ).trim();
        if (!missionId) return jsonResponse(request, { success: false, error: "Mission ID is required." }, 400);

        const mission = await getMission(env.DB, missionId);
        if (!mission) return jsonResponse(request, { success: false, error: "Mission not found." }, 404);

        let body: unknown;
        try { body = await request.json(); }
        catch { return jsonResponse(request, { success: false, error: "Invalid JSON body." }, 400); }

        if (typeof body !== "object" || body === null) {
          return jsonResponse(request, { success: false, error: "Invalid request body." }, 400);
        }

        const payload = body as Record<string, unknown>;
        const userId = typeof payload.userId === "string" ? payload.userId.trim() : "";
        const trustedEventKey =
          typeof payload.trustedEventKey === "string" ? payload.trustedEventKey.trim() || null : null;

        if (!userId) return jsonResponse(request, { success: false, error: "User ID is required." }, 400);

        const targetUser = await env.DB.prepare(
          `SELECT id, status FROM users WHERE id = ? LIMIT 1`,
        ).bind(userId).first<{ id: string; status: string }>();

        if (!targetUser) return jsonResponse(request, { success: false, error: "Target user not found." }, 404);
        if (targetUser.status !== "active") {
          return jsonResponse(request, { success: false, error: "Target user is not active." }, 409);
        }

        const result = await rewardVerifiedMissionCompletion(env.DB, mission, userId, {
          trustedEventKey,
          verificationData: { verifier: "super_admin", verifiedByUserId: auth.user.id },
        });

        const participation = await processMissionParticipation(env.DB, mission, userId, result.completion);
        await writeAdminAudit(env.DB, auth.user.id, "mission.complete", "mission", mission.id, null, { userId, completionId: result.completion.id, activityId: participation.activityId }, request.headers.get("cf-ray"));

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          authorized: true,
          admin: { role: admin.role },
          mission: serializeMission(mission),
          completion: {
            id: result.completion.id,
            missionId: result.completion.mission_id,
            userId: result.completion.user_id,
            seasonId: result.completion.season_id,
            periodKey: result.completion.period_key,
            baseXp: result.completion.base_xp,
            status: result.completion.status,
            xpTransactionId: result.completion.xp_transaction_id,
            verifiedAt: result.completion.verified_at,
            rewardedAt: result.completion.rewarded_at,
          },
          participation,
          award: {
            created: result.award.created,
            lifetimeXp: result.award.lifetimeXp,
            seasonXp: result.award.seasonXp,
            transaction: serializeXpTransaction(result.award.transaction),
          },
        }, result.award.created ? 201 : 200);
      } catch (error) {
        console.error("Mission completion verification failed:", error);
        const message = error instanceof Error ? error.message : "Unable to complete mission.";
        return jsonResponse(request, { success: false, error: message }, 409);
      }
    }

    // =========================================================
    // REFERRAL QUALITY ENGINE
    // v1: permanent referral attachment + referral profile/network.
    // Quality-stage promotion and referral XP are trusted backend flows,
    // not public client-claim actions.
    // =========================================================

    if (request.method === "POST" && url.pathname === "/referrals/attach") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse(request, { success: false, error: "Invalid JSON body." }, 400);
        }

        if (typeof body !== "object" || body === null) {
          return jsonResponse(request, { success: false, error: "Invalid request body." }, 400);
        }

        const payload = body as Record<string, unknown>;
        const referralCode =
          typeof payload.referralCode === "string" ? payload.referralCode.trim() : "";

        if (!referralCode) {
          return jsonResponse(request, { success: false, error: "Referral code is required." }, 400);
        }

        const result = await attachReferral(env.DB, auth.user, referralCode);
        return jsonResponse(request, {
          success: true,
          authenticated: true,
          created: result.created,
          referral: serializeReferralRelationship(result.relationship),
        }, result.created ? 201 : 200);
      } catch (error) {
        console.error("Referral attach failed:", error);
        const message = error instanceof Error ? error.message : "Unable to attach referral.";
        const status =
          message === "Referral code is invalid or inactive." ? 404 :
          message === "Self-referrals are not allowed." ? 409 :
          message.includes("already") ? 409 : 500;
        return jsonResponse(request, { success: false, error: message }, status);
      }
    }

    if (request.method === "GET" && url.pathname === "/referrals/me") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const [relationship, ownership, counts, networkResult] = await Promise.all([
          getReferralRelationshipByReferredUser(env.DB, auth.user.id),
          getGenesisOwnership(env.DB, auth.user.id),
          env.DB.prepare(
            `SELECT
               COUNT(*) AS total,
               SUM(CASE WHEN status = 'joined' THEN 1 ELSE 0 END) AS joined,
               SUM(CASE WHEN status = 'activated' THEN 1 ELSE 0 END) AS activated,
               SUM(CASE WHEN status = 'engaged' THEN 1 ELSE 0 END) AS engaged,
               SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) AS qualified,
               SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) AS blocked
             FROM referral_relationships
             WHERE referrer_user_id = ?`,
          ).bind(auth.user.id).first<ReferralStageCountsRow>(),
          env.DB.prepare(
            `SELECT r.id AS referral_id, r.referred_user_id, u.username,
                    w.address AS wallet_address, r.status, r.joined_at,
                    r.activated_at, r.engaged_at, r.qualified_at
             FROM referral_relationships r
             JOIN users u ON u.id = r.referred_user_id
             JOIN wallets w ON w.user_id = u.id AND w.is_primary = 1
             WHERE r.referrer_user_id = ?
             ORDER BY r.joined_at DESC
             LIMIT 100`,
          ).bind(auth.user.id).all<ReferralNetworkRow>(),
        ]);

        let referrer: { userId: string; username: string | null; referralCode: string } | null = null;
        if (relationship) {
          const row = await env.DB.prepare(
            `SELECT id, username, referral_code
             FROM users
             WHERE id = ?
             LIMIT 1`,
          ).bind(relationship.referrer_user_id)
            .first<{ id: string; username: string | null; referral_code: string }>();

          if (row) {
            referrer = {
              userId: row.id,
              username: row.username,
              referralCode: row.referral_code,
            };
          }
        }

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          referralCode: auth.user.referral_code,
          referredBy: relationship ? {
            relationship: serializeReferralRelationship(relationship),
            referrer,
          } : null,
          referralBoost: {
            percent: ownership?.referral_boost_percent ?? 0,
            genesisTierKey: ownership?.tier_key ?? "none",
            genesisTierName: ownership?.tier_name ?? "None",
          },
          stats: {
            total: counts?.total ?? 0,
            joined: counts?.joined ?? 0,
            activated: counts?.activated ?? 0,
            engaged: counts?.engaged ?? 0,
            qualified: counts?.qualified ?? 0,
            blocked: counts?.blocked ?? 0,
          },
          network: (networkResult.results ?? []).map((row) => ({
            referralId: row.referral_id,
            referredUserId: row.referred_user_id,
            username: row.username,
            walletAddress: getAddress(row.wallet_address),
            status: row.status,
            joinedAt: row.joined_at,
            activatedAt: row.activated_at,
            engagedAt: row.engaged_at,
            qualifiedAt: row.qualified_at,
          })),
        });
      } catch (error) {
        console.error("Referral profile failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to load referral profile." }, 500);
      }
    }

    // =========================================================
    // INTEGRATED USER EXPERIENCE (0010-0017)
    // =========================================================
    if (request.method === "GET" && url.pathname === "/me/overview") {
      try { const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);const season=await getCurrentSeason(env.DB);const [xp,genesis,progression,referral,refCounts,rewards,eligibility,campaigns]=await Promise.all([getXpBalance(env.DB,auth.user.id),getGenesisOwnership(env.DB,auth.user.id),getProgressionSnapshot(env.DB,auth.user.id),getReferralRelationshipByReferredUser(env.DB,auth.user.id),env.DB.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN status='qualified' THEN 1 ELSE 0 END) AS qualified FROM referral_relationships WHERE referrer_user_id=?").bind(auth.user.id).first<{total:number;qualified:number}>(),env.DB.prepare("SELECT COUNT(*) AS total,SUM(CASE WHEN status='claimable' THEN 1 ELSE 0 END) AS claimable,SUM(CASE WHEN status='claimed' THEN 1 ELSE 0 END) AS claimed FROM reward_entitlements WHERE user_id=?").bind(auth.user.id).first<{total:number;claimable:number;claimed:number}>(),env.DB.prepare("SELECT e.result,e.passed_required,e.total_required,e.evaluated_at,p.key,p.name,p.program_type,p.status FROM eligibility_evaluations e JOIN eligibility_programs p ON p.id=e.program_id WHERE e.user_id=? ORDER BY e.evaluated_at DESC LIMIT 10").bind(auth.user.id).all(),env.DB.prepare("SELECT cp.campaign_id,cp.status,cp.score,cp.joined_at,cp.completed_at,c.slug,c.name,c.campaign_type,c.ends_at FROM campaign_participants cp JOIN campaigns c ON c.id=cp.campaign_id WHERE cp.user_id=? ORDER BY cp.updated_at DESC LIMIT 10").bind(auth.user.id).all()]);const participant=season?await getSeasonParticipant(env.DB,season.id,auth.user.id):null;const rank=season&&participant?await getSeasonRankSnapshot(env.DB,auth.user.id,season.id):null;return jsonResponse(request,{success:true,authenticated:true,user:{id:auth.user.id,username:auth.user.username,referralCode:auth.user.referral_code,country:auth.user.country,createdAt:auth.user.created_at},wallet:{address:getAddress(auth.wallet.address),chainId:auth.wallet.chain_id},genesis:genesis?serializeGenesisOwnership(genesis):null,xp:{lifetimeXp:xp?.lifetime_xp??0,seasonXp:participant?.season_xp??0},progression,season:season?{...serializeSeason(season),participant:participant?serializeSeasonParticipant(participant):null,rank}:null,referrals:{referredBy:referral?serializeReferralRelationship(referral):null,total:refCounts?.total??0,qualified:refCounts?.qualified??0},campaigns:campaigns.results??[],eligibility:eligibility.results??[],rewards:{total:rewards?.total??0,claimable:rewards?.claimable??0,claimed:rewards?.claimed??0}});}catch(error){console.error("Overview failed:",error);return jsonResponse(request,{success:false,error:"Unable to load account overview."},500);}
    }
    if(request.method==="GET"&&url.pathname==="/progression/me"){const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);return jsonResponse(request,{success:true,progression:await getProgressionSnapshot(env.DB,auth.user.id)});}
    if(request.method==="GET"&&url.pathname==="/next-move/me"){const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);return jsonResponse(request,{success:true,nextMove:await getNextMoveSnapshot(env.DB,auth.user.id)});}
    if(request.method==="GET"&&url.pathname==="/leaderboard/season"){const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);const season=await getCurrentSeason(env.DB);if(!season)return jsonResponse(request,{success:true,season:null,entries:[]});const top=await env.DB.prepare("SELECT sp.user_id,u.username,sp.season_xp,sp.joined_at FROM season_participants sp JOIN users u ON u.id=sp.user_id WHERE sp.season_id=? AND sp.status='active' ORDER BY sp.season_xp DESC,sp.joined_at ASC,sp.user_id ASC LIMIT 100").bind(season.id).all();return jsonResponse(request,{success:true,season:serializeSeason(season),me:await getSeasonRankSnapshot(env.DB,auth.user.id,season.id),entries:top.results??[]});}
    if(request.method==="GET"&&url.pathname==="/campaigns"){const now=Date.now();const result=await env.DB.prepare("SELECT id,season_id,slug,name,description,campaign_type,status,visibility,join_mode,starts_at,ends_at,participant_cap,display_config FROM campaigns WHERE visibility='public' AND status IN ('active','ended') AND (starts_at IS NULL OR starts_at<=?) ORDER BY starts_at DESC").bind(now).all();return jsonResponse(request,{success:true,campaigns:result.results??[]});}
    if(request.method==="GET"&&url.pathname==="/eligibility/me"){const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);const result=await env.DB.prepare("SELECT e.id,e.result,e.passed_required,e.total_required,e.reason_summary,e.evaluated_at,e.frozen,p.id AS program_id,p.key,p.name,p.program_type,p.version,p.status,p.frozen_at FROM eligibility_evaluations e JOIN eligibility_programs p ON p.id=e.program_id WHERE e.user_id=? ORDER BY e.evaluated_at DESC").bind(auth.user.id).all();return jsonResponse(request,{success:true,evaluations:result.results??[]});}
    if(request.method==="GET"&&url.pathname==="/rewards/me"){const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);const result=await env.DB.prepare("SELECT e.id,e.amount_atomic,e.token_id,e.metadata,e.status,e.earned_at,e.approved_at,e.claimable_at,e.claimed_at,e.cancelled_at,p.key,p.name,p.reward_type,p.asset_chain_id,p.asset_address,p.asset_symbol,p.distribution_mode FROM reward_entitlements e JOIN reward_programs p ON p.id=e.program_id WHERE e.user_id=? ORDER BY e.earned_at DESC").bind(auth.user.id).all();return jsonResponse(request,{success:true,entitlements:result.results??[]});}
    if(request.method==="POST"&&url.pathname==="/admin/referrals/evaluate"){try{const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);const admin=await getActiveAdmin(env.DB,auth.user.id);if(!admin||admin.role!=="super_admin")return jsonResponse(request,{success:false,authorized:false},403);const body=await request.json() as {userId?:string};const userId=body.userId?.trim()??"";if(!userId)return jsonResponse(request,{success:false,error:"User ID is required."},400);const season=await getCurrentSeason(env.DB);const result=await evaluateReferralQuality(env.DB,userId,season?.id??null);await writeAdminAudit(env.DB,auth.user.id,"referral.evaluate","user",userId,null,result,request.headers.get("cf-ray"));return jsonResponse(request,{success:true,result});}catch(error){return jsonResponse(request,{success:false,error:error instanceof Error?error.message:"Unable to evaluate referral."},409);}}
    if(request.method==="GET"&&url.pathname==="/admin/audit"){const auth=await getAuthenticatedContext(request,env);if(!auth)return jsonResponse(request,{success:false,authenticated:false},401);const admin=await getActiveAdmin(env.DB,auth.user.id);if(!admin||admin.role!=="super_admin")return jsonResponse(request,{success:false,authorized:false},403);const result=await env.DB.prepare("SELECT id,admin_user_id,action,target_type,target_id,reason,old_value,new_value,request_id,created_at FROM admin_audit_log ORDER BY created_at DESC LIMIT 100").all();return jsonResponse(request,{success:true,entries:result.results??[]});}

    // =========================================================
    // XP CORE
    // =========================================================

    if (request.method === "GET" && url.pathname === "/xp/me") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const [balance, ownership, recentResult] = await Promise.all([
          getXpBalance(env.DB, auth.user.id),
          getGenesisOwnership(env.DB, auth.user.id),
          env.DB.prepare(
            `SELECT id, user_id, season_id, source_type, source_id,
                    base_xp, boost_xp, total_xp, multiplier_bps, reason,
                    status, idempotency_key, created_at, reversed_at
             FROM xp_transactions
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 25`,
          ).bind(auth.user.id).all<XpTransactionRow>(),
        ]);

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          xp: {
            lifetimeXp: balance?.lifetime_xp ?? 0,
            updatedAt: balance?.updated_at ?? null,
            currentBoost: {
              percent: ownership?.xp_boost_percent ?? 0,
              multiplierBps: 10000 + (ownership?.xp_boost_percent ?? 0) * 100,
              genesisTierKey: ownership?.tier_key ?? "none",
              genesisTierName: ownership?.tier_name ?? "None",
            },
            recentTransactions: (recentResult.results ?? []).map(serializeXpTransaction),
          },
        });
      } catch (error) {
        console.error("XP profile read failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to load XP profile." },
          500,
        );
      }
    }

    // =========================================================
    // GENESIS OWNERSHIP
    // =========================================================

    if (request.method === "GET" && url.pathname === "/genesis/me") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const ownership = await getGenesisOwnership(env.DB, auth.user.id);
        return jsonResponse(request, {
          success: true,
          authenticated: true,
          genesis: ownership ? serializeGenesisOwnership(ownership) : null,
        });
      } catch (error) {
        console.error("Genesis ownership read failed:", error);
        return jsonResponse(request, { success: false, error: "Unable to read Genesis ownership." }, 500);
      }
    }

    if (request.method === "POST" && url.pathname === "/genesis/sync") {
      try {
        const auth = await getAuthenticatedContext(request, env);
        if (!auth) {
          return jsonResponse(request, { success: false, authenticated: false }, 401);
        }

        const now = Date.now();
        const existing = await getGenesisOwnership(env.DB, auth.user.id);
        if (existing && now - existing.synced_at < GENESIS_SYNC_COOLDOWN_MS) {
          return jsonResponse(request, {
            success: true,
            authenticated: true,
            cached: true,
            genesis: serializeGenesisOwnership(existing),
          });
        }

        const client = createPublicClient({ transport: http(env.BNB_RPC_URL) });
        const walletAddress = getAddress(auth.wallet.address);
        const onchainBalance = await client.readContract({
          address: GENESIS_CONTRACT_ADDRESS,
          abi: GENESIS_ABI,
          functionName: "balanceOf",
          args: [walletAddress, GENESIS_PASS_ID],
        });

        const balance = Number(onchainBalance);
        if (!Number.isSafeInteger(balance) || balance < 0) {
          throw new Error("Invalid Genesis balance returned by RPC.");
        }

        const tier = getGenesisTier(balance);
        const createdAt = existing?.created_at ?? now;
        const normalizedWallet = walletAddress.toLowerCase();
        const normalizedContract = GENESIS_CONTRACT_ADDRESS.toLowerCase();

        await env.DB.prepare(
          `INSERT INTO genesis_ownership (
             user_id, wallet_address, chain_id, contract_address, token_id,
             balance, tier_key, tier_name, xp_boost_percent, referral_boost_percent,
             synced_at, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             wallet_address = excluded.wallet_address,
             chain_id = excluded.chain_id,
             contract_address = excluded.contract_address,
             token_id = excluded.token_id,
             balance = excluded.balance,
             tier_key = excluded.tier_key,
             tier_name = excluded.tier_name,
             xp_boost_percent = excluded.xp_boost_percent,
             referral_boost_percent = excluded.referral_boost_percent,
             synced_at = excluded.synced_at,
             updated_at = excluded.updated_at`,
        ).bind(
          auth.user.id, normalizedWallet, AUTH_CHAIN_ID, normalizedContract,
          GENESIS_PASS_ID.toString(), balance, tier.key, tier.name, tier.xpBoost,
          tier.referralBoost, now, createdAt, now,
        ).run();

        const ownership = await getGenesisOwnership(env.DB, auth.user.id);
        if (!ownership) throw new Error("Genesis ownership snapshot was not saved.");

        return jsonResponse(request, {
          success: true,
          authenticated: true,
          cached: false,
          genesis: serializeGenesisOwnership(ownership),
        });
      } catch (error) {
        console.error("Genesis ownership sync failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to sync Genesis ownership right now." },
          502,
        );
      }
    }

    // =========================================================

    // AUTH LOGOUT

    // =========================================================

    if (request.method === "POST" && url.pathname === "/auth/logout") {
      try {
        const sessionToken = getCookieValue(request, SESSION_COOKIE_NAME);
        const now = Date.now();

        if (sessionToken) {
          const tokenHash = await sha256(sessionToken);
          await env.DB.prepare(
            `UPDATE auth_sessions
             SET status = 'revoked', revoked_at = ?
             WHERE token_hash = ? AND status = 'active'`,
          )
            .bind(now, tokenHash)
            .run();
        }

        return jsonResponse(
          request,
          { success: true, authenticated: false },
          200,
          { "Set-Cookie": buildExpiredSessionCookie(request) },
        );
      } catch (error) {
        console.error("Auth logout failed:", error);
        return jsonResponse(
          request,
          { success: false, error: "Unable to log out." },
          500,
        );
      }
    }

    // =========================================================

    // NOT FOUND

    // =========================================================



    return jsonResponse(

      request,

      {

        success: false,

        error: "Not Found",

      },

      404,

    );

  },

};