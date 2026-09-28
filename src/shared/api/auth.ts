const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "https://api.unxlabs.xyz";

export interface AuthChallenge {
  id: string;
  address: string;
  chainId: number;
  message: string;
  expiresAt: number;
}

export interface AuthChallengeResponse {
  success: true;
  challenge: AuthChallenge;
}

export interface AuthUser {
  id: string;
  username: string | null;
  referralCode: string;
  country: string | null;
  status: string;
  createdAt: number;
}

export interface AuthWallet {
  address: string;
  chainId: number;
  isPrimary: boolean;
}

export interface AuthSession {
  expiresAt: number;
}

export interface AuthVerifyResponse {
  success: true;
  authenticated: true;
  isNewUser: boolean;
  user: AuthUser;
  wallet: AuthWallet;
  session: AuthSession;
}

export interface AuthMeResponse {
  success: true;
  authenticated: true;
  user: AuthUser;
  wallet: AuthWallet;
  session: AuthSession;
}

export interface AuthLogoutResponse {
  success: true;
  authenticated: false;
}

interface ApiErrorResponse {
  success: false;
  authenticated?: false;
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
      errorData?.error ||
        `API request failed with status ${response.status}.`,
    );
  }

  return data as T;
}

export async function createAuthChallenge(
  address: string,
): Promise<AuthChallengeResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/challenge`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address,
    }),
  });

  return readJson<AuthChallengeResponse>(response);
}

export async function verifyAuthSignature(
  challengeId: string,
  signature: string,
): Promise<AuthVerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      challengeId,
      signature,
    }),
  });

  return readJson<AuthVerifyResponse>(response);
}

export async function getAuthSession(): Promise<AuthMeResponse | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    return null;
  }

  return readJson<AuthMeResponse>(response);
}

export async function logoutAuthSession(): Promise<AuthLogoutResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return readJson<AuthLogoutResponse>(response);
}
