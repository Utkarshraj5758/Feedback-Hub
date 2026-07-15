import { tokenStore } from "./tokenStore";
import { ApiError } from "./types";

const BASE = "/api";

// Endpoints where a 401 is a normal part of the contract (bad credentials /
// absent refresh cookie) and must NOT trigger the refresh-retry loop.
const NO_REFRESH_PATHS = new Set(["/auth/login", "/auth/refresh"]);

let onUnauthorized: (() => void) | null = null;

/** AuthContext registers a handler so a failed background refresh logs out. */
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

let refreshInFlight: Promise<string> | null = null;

/**
 * POST /auth/refresh using the httpOnly cookie. Single-flighted so many
 * concurrent 401s cause exactly one refresh. Resolves to the new access token
 * (also stored) or rejects.
 */
export function rawRefresh(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError(res.status, "Session refresh failed");
        const data = (await res.json()) as { accessToken: string };
        tokenStore.set(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

interface FetchOptions extends RequestInit {
  _retried?: boolean;
}

/**
 * fetch wrapper: attaches the Bearer access token, always sends credentials so
 * the refresh cookie flows, and on a 401 (once) refreshes the token and retries
 * the original request. If refresh fails, clears state and notifies the app.
 */
export async function apiFetch(
  path: string,
  init: FetchOptions = {},
): Promise<Response> {
  const token = tokenStore.get();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (res.status !== 401 || init._retried || NO_REFRESH_PATHS.has(path)) {
    return res;
  }

  try {
    await rawRefresh();
  } catch {
    tokenStore.clear();
    onUnauthorized?.();
    return res;
  }
  return apiFetch(path, { ...init, _retried: true });
}

/**
 * apiFetch + JSON parsing. Throws ApiError (with the server's `error` message
 * when present) on non-2xx. Shared by authApi and domainApi.
 */
export async function apiJson<T>(
  path: string,
  init: FetchOptions = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

/** Convenience for JSON POST/PATCH bodies. */
export function jsonBody(data: unknown): RequestInit {
  return { body: JSON.stringify(data) };
}
