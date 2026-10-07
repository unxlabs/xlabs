const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

interface ApiErrorResponse {
  success: false;
  authenticated?: false;
  error?: string;
}

export interface GenesisSyncResponse {
  success: true;
  authenticated: true;
  cached: boolean;
  genesis: unknown;
  progressionUnlocks?: unknown;
}

export interface ActivitySyncResponse {
  success: true;
  authenticated: true;
  activity: unknown;
  streak: unknown;
  missions: unknown;
}

export interface ProgressionSyncResponse {
  success: true;
  authenticated: true;
  streak: unknown;
  unlocks: unknown;
  progression: unknown;
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
      errorData?.error ||
        `API request failed with status ${response.status}.`,
    );
  }

  return data as T;
}

async function postSync<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  return readJson<T>(response);
}

export async function syncGenesis(): Promise<GenesisSyncResponse> {
  return postSync<GenesisSyncResponse>("/genesis/sync");
}

export async function syncActivity(): Promise<ActivitySyncResponse> {
  return postSync<ActivitySyncResponse>("/activity/sync");
}

export async function syncProgression(): Promise<ProgressionSyncResponse> {
  return postSync<ProgressionSyncResponse>("/progression/sync");
}

export interface IntegrationSyncResult {
  genesis: GenesisSyncResponse;
  activity: ActivitySyncResponse;
  progression: ProgressionSyncResponse;
}

/**
 * Synchronizes the authenticated user's on-chain state into the
 * Unlimited X backend in dependency order:
 *
 * 1. Genesis ownership
 * 2. Earn / Stake trusted activity + mission verification
 * 3. Progression / streaks / unlocks
 *
 * The calls intentionally run sequentially because later stages depend
 * on data written or refreshed by earlier stages.
 */
export async function syncIntegrationBridge(): Promise<IntegrationSyncResult> {
  const genesis = await syncGenesis();
  const activity = await syncActivity();
  const progression = await syncProgression();

  return {
    genesis,
    activity,
    progression,
  };
}