import type { LoginInput, RegisterInput } from "@feedbackhub/shared";
import { apiFetch } from "./apiClient";
import {
  ApiError,
  type LoginResponse,
  type MeResponse,
  type RegisterResponse,
} from "./types";

async function parse<T>(res: Response): Promise<T> {
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

export async function apiRegister(
  input: RegisterInput,
): Promise<RegisterResponse> {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parse<RegisterResponse>(res);
}

export async function apiLogin(input: LoginInput): Promise<LoginResponse> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parse<LoginResponse>(res);
}

export async function apiMe(): Promise<MeResponse> {
  const res = await apiFetch("/auth/me");
  return parse<MeResponse>(res);
}

export async function apiLogout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}
