const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface OnchainActivity {
  id: string;
  season_id: string | null;
  event_type: string;
  source_type: "onchain";
  source_id: string | null;
  trust_level: string;
  occurred_at: number;
  evidence: string | null;
  metadata: string | null;
  created_at: number;
}

export interface MyActivityResponse {
  success: true;
  authenticated: true;
  activities: OnchainActivity[];
}

async function readJson<T>(response: Response): Promise<T> {
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("The API returned an invalid response.");
  }
  if (!response.ok) {
    const body = data as { error?: string };
    throw new Error(body?.error || `API request failed with status ${response.status}.`);
  }
  return data as T;
}

export async function getMyOnchainActivity(): Promise<MyActivityResponse> {
  return readJson(
    await fetch(`${API_BASE_URL}/activity/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }),
  );
}
