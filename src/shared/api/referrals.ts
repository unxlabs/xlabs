const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export type ReferralStage =
  | "joined"
  | "activated"
  | "engaged"
  | "qualified"
  | "blocked";

export interface ReferralRelationship {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  status: ReferralStage;
  joinedAt: number;
  activatedAt: number | null;
  engagedAt: number | null;
  qualifiedAt: number | null;
  blockedAt?: number | null;
}

export interface ReferralNetworkMember {
  referralId: string;
  referredUserId: string;
  username: string | null;
  walletAddress: string;
  status: ReferralStage;
  joinedAt: number;
  activatedAt: number | null;
  engagedAt: number | null;
  qualifiedAt: number | null;
}

export interface ReferralProfileResponse {
  success: true;
  authenticated: true;
  referralCode: string;
  referredBy: {
    relationship: ReferralRelationship;
    referrer: {
      userId: string;
      username: string | null;
      referralCode: string;
    } | null;
  } | null;
  referralBoost: {
    percent: number;
    genesisTierKey: string;
    genesisTierName: string;
  };
  stats: {
    total: number;
    joined: number;
    activated: number;
    engaged: number;
    qualified: number;
    blocked: number;
  };
  network: ReferralNetworkMember[];
}

export interface AttachReferralResponse {
  success: true;
  authenticated: true;
  created: boolean;
  referral: ReferralRelationship;
}

interface ApiErrorResponse {
  success: false;
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

export async function getReferralProfile(): Promise<ReferralProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/referrals/me`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  return readJson<ReferralProfileResponse>(response);
}

export async function attachReferralCode(
  referralCode: string,
): Promise<AttachReferralResponse> {
  const response = await fetch(`${API_BASE_URL}/referrals/attach`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referralCode: referralCode.trim() }),
  });

  return readJson<AttachReferralResponse>(response);
}
