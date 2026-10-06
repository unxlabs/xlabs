const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface LeaderboardSeason {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  isCurrent: boolean;
  startsAt: number | null;
  endsAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  walletAddress: string | null;
  seasonXp: number;
  joinedAt: number;
  isMe: boolean;
}

export interface LeaderboardMe {
  rank: number;
  seasonXp: number;
  totalParticipants: number;
  xpToNextRank: number | null;
  nextRankXp: number | null;
}

export interface SeasonLeaderboardResponse {
  success: true;
  season: LeaderboardSeason | null;
  totalParticipants: number;
  me: LeaderboardMe | null;
  entries: LeaderboardEntry[];
  aroundMe: LeaderboardEntry[];
}

interface ApiErrorResponse { success: false; error?: string; }

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

export async function getSeasonLeaderboard(): Promise<SeasonLeaderboardResponse> {
  const raw = await readJson<any>(await fetch(`${API_BASE_URL}/leaderboard/season`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  }));

  // Backward-compatible normalization while the enhanced API rolls out.
  const normalize = (entry: any, index: number): LeaderboardEntry => ({
    rank: Number(entry.rank ?? index + 1),
    userId: String(entry.userId ?? entry.user_id ?? ""),
    username: entry.username ?? null,
    walletAddress: entry.walletAddress ?? entry.wallet_address ?? null,
    seasonXp: Number(entry.seasonXp ?? entry.season_xp ?? 0),
    joinedAt: Number(entry.joinedAt ?? entry.joined_at ?? 0),
    isMe: Boolean(entry.isMe ?? false),
  });

  const entries = Array.isArray(raw.entries) ? raw.entries.map(normalize) : [];
  const me = raw.me ? {
    rank: Number(raw.me.rank ?? 0),
    seasonXp: Number(raw.me.seasonXp ?? raw.me.season_xp ?? 0),
    totalParticipants: Number(raw.me.totalParticipants ?? raw.totalParticipants ?? entries.length),
    xpToNextRank: raw.me.xpToNextRank == null ? null : Number(raw.me.xpToNextRank),
    nextRankXp: raw.me.nextRankXp == null ? null : Number(raw.me.nextRankXp),
  } : null;

  return {
    success: true,
    season: raw.season ?? null,
    totalParticipants: Number(raw.totalParticipants ?? me?.totalParticipants ?? entries.length),
    me,
    entries,
    aroundMe: Array.isArray(raw.aroundMe) ? raw.aroundMe.map(normalize) : [],
  };
}
