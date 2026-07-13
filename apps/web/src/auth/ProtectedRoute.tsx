import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Guards nested routes: shows nothing while the initial silent refresh is in
// flight (so returning users don't see a login flash), redirects to /login when
// unauthenticated, otherwise renders the matched child route.
export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
