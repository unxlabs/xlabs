const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface AdminTierDistribution {
  tier_key: string;
  tier_name: string;
  holders: number;
  passes: number;
}

export interface AdminOverviewResponse {
  success: true;
  authenticated: true;
  authorized: true;
  admin: { role: "admin" | "super_admin" };
  generatedAt: number;
  periods: {
    todayTimezone: string;
    sevenDays: string;
    thirtyDays: string;
  };
  users: {
    total: number;
    newToday: number;
    new7d: number;
    new30d: number;
    active7d: number;
    active30d: number;
  };
  wallets: { total: number };
  genesis: {
    holders: number;
    passes: number;
    tierDistribution: AdminTierDistribution[];
  };
}

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export async function getAdminOverview(): Promise<AdminOverviewResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/overview`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new AdminApiError("The API returned an invalid response.", response.status);
  }

  if (!response.ok) {
    const body = data as { error?: string };
    throw new AdminApiError(
      body?.error ||
        (response.status === 401
          ? "Sign in with an authorized wallet."
          : response.status === 403
            ? "This account does not have admin access."
            : "Unable to load admin analytics."),
      response.status,
    );
  }

  return data as AdminOverviewResponse;
}
