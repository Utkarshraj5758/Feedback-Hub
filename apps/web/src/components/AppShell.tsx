import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

interface Props {
  children: ReactNode;
  back?: { to: string; label: string };
}

// Shared authenticated layout: brand header with user/org + logout, and a
// centered content container. Optional back link above the content.
export function AppShell({ children, back }: Props) {
  const { user, org, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="font-semibold text-gray-900">
            FeedbackHub
          </Link>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="hidden sm:inline">
              {user?.email}
              {org ? ` · ${org.name}` : ""}
            </span>
            <button onClick={() => void logout()} className="hover:text-gray-900">
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {back && (
          <Link
            to={back.to}
            className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-900"
          >
            &larr; {back.label}
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}
