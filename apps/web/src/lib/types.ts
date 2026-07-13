// Frontend-facing shapes of the auth API responses (dates arrive as strings
// over JSON). These mirror the api's sanitized payloads — no passwordHash.
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthOrg {
  id: string;
  name: string;
  plan: string;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser;
  org: AuthOrg;
  role: string;
  membershipId: string;
}

/** GET /auth/me → { auth: {...} } */
export interface MeResponse {
  auth: AuthState;
}

/** POST /auth/login → { accessToken, user } */
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/** POST /auth/register → { user } */
export interface RegisterResponse {
  user: AuthUser;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
