// Access token lives in memory only (never localStorage) per the auth design:
// short-lived access token in memory, long-lived refresh token in an httpOnly
// cookie the JS never touches.
let accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string): void => {
    accessToken = token;
  },
  clear: (): void => {
    accessToken = null;
  },
};
