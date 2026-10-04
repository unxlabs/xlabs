const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface NextMoveNetwork {
  total: number;
  activated: number;
  engaged: number;
  qualified: number;
}

export interface NextMove {
  key: string;
  category: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  priority: number;
  reason: string;
  verification: string;
  network?: NextMoveNetwork;
}

interface NextMoveResponse {
  success: true;
  nextMove: NextMove | null;
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

export async function getMyNextMove(): Promise<NextMoveResponse> {
  return readJson(
    await fetch(`${API_BASE_URL}/next-move/me`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }),
  );
}
