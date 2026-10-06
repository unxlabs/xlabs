const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export type EligibilityResult = "eligible" | "ineligible" | "review" | "excluded";

export interface EligibilityRuleResult {
  ruleId: string;
  key: string;
  name: string;
  ruleType: string;
  operator: string;
  targetValue: number | null;
  required: boolean;
  passed: boolean;
  observedValue: number | null;
  reason: string | null;
  evidence: Record<string, unknown>;
}

export interface EligibilityEvaluationRecord {
  program: {
    id: string;
    key: string;
    name: string;
    description: string | null;
    programType: string;
    version: number;
    status: string;
    seasonId: string | null;
    campaignId: string | null;
    startsAt: number | null;
    endsAt: number | null;
    frozenAt: number | null;
  };
  evaluation: null | {
    id: string;
    result: EligibilityResult;
    passedRequired: number;
    totalRequired: number;
    reasonSummary: string | null;
    evaluatedAt: number;
    frozen: boolean;
    rules: EligibilityRuleResult[];
  };
}

interface EligibilityResponse {
  success: true;
  evaluations: EligibilityEvaluationRecord[];
}

interface ApiErrorResponse { success: false; error?: string; }

async function readJson(response: Response): Promise<EligibilityResponse> {
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new Error("The API returned an invalid response."); }

  if (!response.ok) {
    const errorData = data as ApiErrorResponse;
    throw new Error(errorData.error || `API request failed with status ${response.status}.`);
  }

  return data as EligibilityResponse;
}

export async function getMyEligibility(): Promise<EligibilityResponse> {
  return readJson(await fetch(`${API_BASE_URL}/eligibility/me`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  }));
}

export async function syncMyEligibility(): Promise<EligibilityResponse> {
  return readJson(await fetch(`${API_BASE_URL}/eligibility/sync`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  }));
}
