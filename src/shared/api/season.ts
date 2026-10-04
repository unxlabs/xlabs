const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface SeasonRecord { id: string; slug: string; name: string; description: string | null; status: string; isCurrent: boolean; startsAt: number | null; endsAt: number | null; createdAt: number; updatedAt: number; }
export interface SeasonParticipation { id: string; seasonId: string; userId: string; status: string; seasonXp: number; joinedAt: number; lastActiveAt: number; updatedAt: number; }
export interface MissionProgress { status: string; progressValue: number; targetValue: number; completionCount: number; firstStartedAt: number | null; lastProgressAt: number | null; lastCompletedAt: number | null; }
export interface MissionAppSteps { requiredSteps: string[]; }
export interface MissionRecord {
  id: string; seasonId: string; slug: string; name: string; description: string | null;
  category: "explore" | "engage" | "spread" | "invite" | "build";
  verificationType: "instant" | "onchain" | "referral" | "social" | "manual" | "system";
  appSteps?: MissionAppSteps | null; baseXp: number; status: string;
  repeatType: "once" | "daily" | "weekly" | "repeatable"; maxCompletions: number | null;
  sortOrder: number; startsAt: number | null; endsAt: number | null; availableNow: boolean; createdAt: number; updatedAt: number;
  progress?: MissionProgress; completedSteps?: string[]; verifiedCompletionCount?: number; lastVerifiedCompletionAt?: number | null;
}
interface ApiErrorResponse { success: false; error?: string; }
export interface CurrentSeasonResponse { success: true; season: SeasonRecord | null; }
export interface SeasonMeResponse { success: true; authenticated: true; season: SeasonRecord | null; participation: SeasonParticipation | null; }
export interface JoinSeasonResponse extends SeasonMeResponse { created: boolean; }
export interface MissionsResponse { success: true; season: SeasonRecord | null; missions: MissionRecord[]; }
export interface MyMissionsResponse { success: true; authenticated: true; season: SeasonRecord | null; participation: SeasonParticipation | null; missions: MissionRecord[]; }
export interface MissionStepProgressResponse {
  success: true; authenticated: true; mission: MissionRecord; completed: boolean;
  progress: { status: string; progressValue: number; targetValue: number; completedSteps: string[]; requiredSteps: string[]; };
  award: null | { transactionId: string; baseXp: number; boostXp: number; totalXp: number; created: boolean; };
}
async function readJson<T>(response: Response): Promise<T> { let data: unknown; try { data = await response.json(); } catch { throw new Error("The API returned an invalid response."); } if (!response.ok) { const errorData=data as ApiErrorResponse; throw new Error(errorData.error || `API request failed with status ${response.status}.`); } return data as T; }
export async function getCurrentSeason(): Promise<CurrentSeasonResponse> { return readJson(await fetch(`${API_BASE_URL}/season/current`,{method:"GET",credentials:"include",headers:{Accept:"application/json"}})); }
export async function getSeasonProfile(): Promise<SeasonMeResponse> { return readJson(await fetch(`${API_BASE_URL}/season/me`,{method:"GET",credentials:"include",headers:{Accept:"application/json"}})); }
export async function joinCurrentSeason(): Promise<JoinSeasonResponse> { return readJson(await fetch(`${API_BASE_URL}/season/join`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"}})); }
export async function getPublicMissions(): Promise<MissionsResponse> { return readJson(await fetch(`${API_BASE_URL}/missions`,{method:"GET",credentials:"include",headers:{Accept:"application/json"}})); }
export async function getMyMissions(): Promise<MyMissionsResponse> { return readJson(await fetch(`${API_BASE_URL}/missions/me`,{method:"GET",credentials:"include",headers:{Accept:"application/json"}})); }
export async function recordMissionStep(missionId:string, stepKey:string): Promise<MissionStepProgressResponse> { return readJson(await fetch(`${API_BASE_URL}/missions/${encodeURIComponent(missionId)}/progress`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({stepKey})})); }
