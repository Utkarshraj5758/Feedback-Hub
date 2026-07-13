import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LoginInput, RegisterInput } from "@feedbackhub/shared";
import { rawRefresh, setUnauthorizedHandler } from "../lib/apiClient";
import { apiLogin, apiLogout, apiMe, apiRegister } from "../lib/authApi";
import { tokenStore } from "../lib/tokenStore";
import type { AuthOrg, AuthState, AuthUser } from "../lib/types";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  org: AuthOrg | null;
  role: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [auth, setAuth] = useState<AuthState | null>(null);

  const reset = useCallback(() => {
    tokenStore.clear();
    setAuth(null);
    setStatus("unauthenticated");
  }, []);

  // A failed background refresh (via apiClient) drops us to unauthenticated;
  // ProtectedRoute then redirects to /login.
  useEffect(() => {
    setUnauthorizedHandler(reset);
    return () => setUnauthorizedHandler(null);
  }, [reset]);

  // On load, attempt a silent refresh so a returning user with a valid refresh
  // cookie stays logged in without re-entering credentials.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await rawRefresh();
        const { auth: me } = await apiMe();
        if (!cancelled) {
          setAuth(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) reset();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const login = useCallback(async (input: LoginInput) => {
    const { accessToken } = await apiLogin(input);
    tokenStore.set(accessToken);
    const { auth: me } = await apiMe();
    setAuth(me);
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (input: RegisterInput) => {
      await apiRegister(input);
      await login({ email: input.email, password: input.password });
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // best-effort; clear local state regardless
    }
    reset();
  }, [reset]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: auth?.user ?? null,
      org: auth?.org ?? null,
      role: auth?.role ?? null,
      login,
      register,
      logout,
    }),
    [status, auth, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
