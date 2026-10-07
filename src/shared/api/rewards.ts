const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export type RewardStatus =
  | "pending"
  | "approved"
  | "claimable"
  | "processing"
  | "claimed"
  | "cancelled"
  | string;

export interface RewardSummary {
  total: number;
  pending: number;
  approved: number;
  claimable: number;
  processing: number;
  claimed: number;
  cancelled: number;
}

export interface RewardEntitlement {
  id: string;
  program_id: string;
  user_id: string;
  eligibility_evaluation_id: string | null;
  amount_atomic: string | null;
  token_id: string | null;
  metadata: Record<string, unknown> | null;
  status: RewardStatus;
  earned_at: number | null;
  approved_at: number | null;
  claimable_at: number | null;
  claimed_at: number | null;
  cancelled_at: number | null;
  idempotency_key: string;
  created_at: number;
  updated_at: number;
  program_key: string;
  program_name: string;
  reward_type: string;
  asset_chain_id: number | null;
  asset_address: string | null;
  asset_symbol: string | null;
  distribution_mode: string;
  program_status: string;
}

export interface RewardAllocation {
  id: string;
  snapshot_id: string;
  status: string;
  score: string | number | null;
  weight: string | number | null;
  amount_atomic: string | null;
  tier_key: string | null;
  reason: string | null;
  evidence: Record<string, unknown> | null;
  approved_at: number | null;
  materialized_at: number | null;
  snapshot_key: string;
  snapshot_status: string;
  program_key: string;
  program_name: string;
  asset_symbol: string | null;
}

export interface RewardDistributionItem {
  id: string;
  entitlement_id: string;
  wallet_address: string;
  amount_atomic: string | null;
  token_id: string | null;
  claim_index: number | null;
  claim_proof: string | null;
  status: string;
  delivered_at: number | null;
  batch_id: string;
  batch_key: string;
  batch_status: string;
  distribution_mode: string;
  chain_id: number | null;
  asset_address: string | null;
  asset_symbol: string | null;
  merkle_root: string | null;
  distributor_address: string | null;
  starts_at: number | null;
  ends_at: number | null;
}

export interface RewardDeliveryAttempt {
  id: string;
  entitlement_id: string;
  attempt_number: number;
  status: string;
  tx_hash: string | null;
  error_code: string | null;
  error_message: string | null;
  started_at: number | null;
  submitted_at: number | null;
  confirmed_at: number | null;
  failed_at: number | null;
  metadata: Record<string, unknown> | null;
}

export interface RewardProfile {
  summary: RewardSummary;
  entitlements: RewardEntitlement[];
  allocations: RewardAllocation[];
  distributionItems: RewardDistributionItem[];
  deliveryAttempts: RewardDeliveryAttempt[];
}

export interface RewardHistoryEvent {
  id: string;
  program_id: string | null;
  entitlement_id: string | null;
  batch_id: string | null;
  event_type: string;
  actor_type: string;
  metadata: Record<string, unknown> | null;
  occurred_at: number;
}

interface RewardsMeResponse {
  success: true;
  rewards: RewardProfile;
}

interface RewardsHistoryResponse {
  success: true;
  events: RewardHistoryEvent[];
}

interface ApiErrorResponse {
  success: false;
  authenticated?: false;
  error?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The API returned an invalid response.");
  }

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new Error(
      errorData.error || `API request failed with status ${response.status}.`,
    );
  }

  return data as T;
}

export async function getMyRewards(): Promise<RewardsMeResponse> {
  return readJson(
    await fetch(`${API_BASE_URL}/rewards/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }),
  );
}

export async function getMyRewardHistory(): Promise<RewardsHistoryResponse> {
  return readJson(
    await fetch(`${API_BASE_URL}/rewards/history`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }),
  );
}
