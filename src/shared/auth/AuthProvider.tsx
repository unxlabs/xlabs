import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAccount, useSignMessage } from "wagmi";
import { stringToHex } from "viem";

import {
  createAuthChallenge,
  getAuthSession,
  logoutAuthSession,
  verifyAuthSignature,
  type AuthSession,
  type AuthUser,
  type AuthWallet,
} from "@/shared/api/auth";

type AuthStatus =
  | "disconnected"
  | "connected"
  | "restoring"
  | "authenticating"
  | "authenticated"
  | "error";

interface AuthContextValue {
  status: AuthStatus;
  isConnected: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isRestoring: boolean;
  user: AuthUser | null;
  wallet: AuthWallet | null;
  session: AuthSession | null;
  error: string | null;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to authenticate wallet.";
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const {
    address,
    isConnected,
    connector,
  } = useAccount();

  const {
    signMessageAsync,
  } = useSignMessage();

  const [status, setStatus] = useState<AuthStatus>(
    isConnected ? "connected" : "disconnected",
  );

  const [user, setUser] = useState<AuthUser | null>(null);
  const [wallet, setWallet] = useState<AuthWallet | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authenticatedAddressRef = useRef<string | null>(null);
  const restoreAttemptAddressRef = useRef<string | null>(null);

  const clearAuth = useCallback(() => {
    authenticatedAddressRef.current = null;

    setUser(null);
    setWallet(null);
    setSession(null);
    setError(null);

    setStatus(isConnected ? "connected" : "disconnected");
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected || !address) {
      authenticatedAddressRef.current = null;
      restoreAttemptAddressRef.current = null;

      setUser(null);
      setWallet(null);
      setSession(null);
      setError(null);
      setStatus("disconnected");

      return;
    }

    const normalizedAddress = address.toLowerCase();

    if (
      authenticatedAddressRef.current &&
      authenticatedAddressRef.current !== normalizedAddress
    ) {
      authenticatedAddressRef.current = null;

      setUser(null);
      setWallet(null);
      setSession(null);
      setError(null);
    }

    if (restoreAttemptAddressRef.current === normalizedAddress) {
      setStatus((currentStatus) => {
        if (
          currentStatus === "authenticated" ||
          currentStatus === "authenticating" ||
          currentStatus === "restoring"
        ) {
          return currentStatus;
        }

        return "connected";
      });

      return;
    }

    restoreAttemptAddressRef.current = normalizedAddress;

    let cancelled = false;

    const restoreSession = async () => {
      setStatus("restoring");
      setError(null);

      try {
        const restored = await getAuthSession();

        if (cancelled) {
          return;
        }

        if (!restored) {
          authenticatedAddressRef.current = null;
          setUser(null);
          setWallet(null);
          setSession(null);
          setStatus("connected");
          return;
        }

        const restoredAddress = restored.wallet.address.toLowerCase();

        if (restoredAddress !== normalizedAddress) {
          authenticatedAddressRef.current = null;
          setUser(null);
          setWallet(null);
          setSession(null);
          setStatus("connected");
          return;
        }

        authenticatedAddressRef.current = restoredAddress;

        setUser(restored.user);
        setWallet(restored.wallet);
        setSession(restored.session);
        setStatus("authenticated");
      } catch (restoreError) {
        if (cancelled) {
          return;
        }

        authenticatedAddressRef.current = null;
        setUser(null);
        setWallet(null);
        setSession(null);
        setError(getErrorMessage(restoreError));
        setStatus("connected");
      }
    };

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const authenticate = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Connect your wallet before signing in.");
      setStatus("disconnected");
      return;
    }

    setStatus("authenticating");
    setError(null);

    try {
      const challengeResponse = await createAuthChallenge(address);

      let signature: string;

      if (connector) {
        const provider = (await connector.getProvider()) as {
          request: (args: {
            method: string;
            params?: readonly unknown[] | object;
          }) => Promise<unknown>;
        };

        const providerSignature = await provider.request({
          method: "personal_sign",
          params: [
            stringToHex(challengeResponse.challenge.message),
            address,
          ],
        });

        if (
          typeof providerSignature !== "string" ||
          !providerSignature.startsWith("0x")
        ) {
          throw new Error("Wallet returned an invalid signature.");
        }

        signature = providerSignature;
      } else {
        signature = await signMessageAsync({
          message: challengeResponse.challenge.message,
        });
      }

      const verifyResponse = await verifyAuthSignature(
        challengeResponse.challenge.id,
        signature,
      );

      const verifiedAddress =
        verifyResponse.wallet.address.toLowerCase();

      if (verifiedAddress !== address.toLowerCase()) {
        throw new Error(
          "Authenticated wallet does not match the connected wallet.",
        );
      }

      authenticatedAddressRef.current = verifiedAddress;
      restoreAttemptAddressRef.current = verifiedAddress;

      setUser(verifyResponse.user);
      setWallet(verifyResponse.wallet);
      setSession(verifyResponse.session);
      setStatus("authenticated");
    } catch (authError) {
      authenticatedAddressRef.current = null;

      setUser(null);
      setWallet(null);
      setSession(null);
      setError(getErrorMessage(authError));
      setStatus("error");
    }
  }, [
    address,
    connector,
    isConnected,
    signMessageAsync,
  ]);

  const logout = useCallback(async () => {
    setError(null);

    try {
      await logoutAuthSession();
    } catch (logoutError) {
      setError(getErrorMessage(logoutError));
    } finally {
      authenticatedAddressRef.current = null;
      restoreAttemptAddressRef.current = address?.toLowerCase() ?? null;

      setUser(null);
      setWallet(null);
      setSession(null);
      setStatus(isConnected && address ? "connected" : "disconnected");
    }
  }, [address, isConnected]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      isConnected,
      isAuthenticated: status === "authenticated",
      isAuthenticating: status === "authenticating",
      isRestoring: status === "restoring",
      user,
      wallet,
      session,
      error,
      authenticate,
      logout,
      clearAuth,
    }),
    [
      status,
      isConnected,
      user,
      wallet,
      session,
      error,
      authenticate,
      logout,
      clearAuth,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}
