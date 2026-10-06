const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export type CampaignWindowState = "upcoming" | "live" | "ended" | "paused" | "inactive";
export type CampaignParticipantStatus = "active" | "completed" | "disqualified" | "withdrawn";

export interface CampaignMission {
  missionId: string;
  slug: string;
  name: string;
  description: string | null;
  baseXp: number;
  required: boolean;
  completed: boolean;
}

export interface CampaignProgress {
  missions: CampaignMission[];
  requiredTotal: number;
  requiredCompleted: number;
  optionalTotal: number;
  optionalCompleted: number;
  complete: boolean;
  score: number;
}

export interface CampaignRequirementCheck {
  key: string;
  required: number | string;
  actual: number | string | null;
  passed: boolean;
}

export interface CampaignRecord {
  id: string;
  seasonId: string | null;
  slug: string;
  name: string;
  description: string | null;
  campaignType: string;
  status: string;
  windowState: CampaignWindowState;
  visibility: string;
  joinMode: string;
  startsAt: number | null;
  endsAt: number | null;
  participantCap: number | null;
  displayConfig: Record<string, unknown>;
  requirements: null | { eligible: boolean; checks: CampaignRequirementCheck[] };
  participant: null | {
    status: CampaignParticipantStatus;
    joinedAt: number;
    completedAt: number | null;
    score: number;
  };
  progress: CampaignProgress | null;
}

interface ApiErrorResponse { success: false; error?: string; }
interface CampaignsResponse { success: true; campaigns: CampaignRecord[]; }
interface CampaignResponse { success: true; campaign: CampaignRecord; }

async function readJson<T>(response: Response): Promise<T> {
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new Error("The API returned an invalid response."); }
  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new Error(errorData.error || `API request failed with status ${response.status}.`);
  }
  return data as T;
}

export async function getMyCampaigns(): Promise<CampaignsResponse> {
  return readJson(await fetch(`${API_BASE_URL}/campaigns/me`, {
    method: "GET", credentials: "include", headers: { Accept: "application/json" },
  }));
}

export async function getCampaign(slug: string): Promise<CampaignResponse> {
  return readJson(await fetch(`${API_BASE_URL}/campaigns/${encodeURIComponent(slug)}`, {
    method: "GET", credentials: "include", headers: { Accept: "application/json" },
  }));
}

export async function joinCampaign(slug: string): Promise<CampaignResponse> {
  return readJson(await fetch(`${API_BASE_URL}/campaigns/${encodeURIComponent(slug)}/join`, {
    method: "POST", credentials: "include", headers: { Accept: "application/json" },
  }));
}

export async function syncCampaign(slug: string): Promise<CampaignResponse> {
  return readJson(await fetch(`${API_BASE_URL}/campaigns/${encodeURIComponent(slug)}/sync`, {
    method: "POST", credentials: "include", headers: { Accept: "application/json" },
  }));
}
