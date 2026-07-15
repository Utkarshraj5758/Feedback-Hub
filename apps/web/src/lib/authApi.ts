import type { LoginInput, RegisterInput } from "@feedbackhub/shared";
import { apiFetch, apiJson, jsonBody } from "./apiClient";
import type { LoginResponse, MeResponse, RegisterResponse } from "./types";

export function apiRegister(input: RegisterInput): Promise<RegisterResponse> {
  return apiJson<RegisterResponse>("/auth/register", {
    method: "POST",
    ...jsonBody(input),
  });
}

export function apiLogin(input: LoginInput): Promise<LoginResponse> {
  return apiJson<LoginResponse>("/auth/login", {
    method: "POST",
    ...jsonBody(input),
  });
}

export function apiMe(): Promise<MeResponse> {
  return apiJson<MeResponse>("/auth/me");
}

export async function apiLogout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}
