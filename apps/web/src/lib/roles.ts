/** Client-side mirror of the backend role gate. Enforcement stays server-side. */
export function isAdmin(role: string | null): boolean {
  return role === "owner" || role === "admin";
}
