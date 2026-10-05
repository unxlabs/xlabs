const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface ProgressionLevel {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  minLifetimeXp: number;
  iconKey?: string | null;
  benefitsConfig?: unknown;
  index: number;
  sortOrder?: number;
  status?: "reached" | "next" | "locked";
}

export interface ProgressionMilestone {
  id: string;
  milestone_id: string;
  season_id: string | null;
  achieved_value: number;
  unlocked_at: number;
  key: string;
  name: string;
  metric_type: string;
  target_value: number;
}

export interface ProgressionAchievement {
  id: string;
  season_id: string | null;
  earned_at: number;
  key: string;
  name: string;
  category: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | string;
  icon_key: string | null;
}

export interface ProgressionStreak {
  streak_type: string;
  current_count: number;
  best_count: number;
  last_period_key: string | null;
  last_qualified_at: number | null;
  freeze_count: number;
  metadata: string | null;
  updated_at: number;
}

export interface ProgressionSnapshot {
  lifetimeXp: number;
  currentLevel: ProgressionLevel | null;
  nextLevel: ProgressionLevel | null;
  progress: {
    xpIntoCurrentLevel: number;
    levelXpSpan: number;
    xpToNextLevel: number;
    progressPercent: number;
    currentLevelFloor: number;
    nextLevelTarget: number | null;
    isMaxLevel: boolean;
  };
  levels: ProgressionLevel[];
  xpToNextLevel: number;
  milestones: ProgressionMilestone[];
  achievements: ProgressionAchievement[];
  streaks: ProgressionStreak[];
}

interface ProgressionResponse {
  success: true;
  progression: ProgressionSnapshot;
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

export async function getMyProgression(): Promise<ProgressionResponse> {
  return readJson(
    await fetch(`${API_BASE_URL}/progression/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }),
  );
}
