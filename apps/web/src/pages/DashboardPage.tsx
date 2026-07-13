import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { user, org, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-semibold text-gray-900">FeedbackHub</span>
          <button
            onClick={() => void logout()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">You&rsquo;re signed in.</p>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Signed in as
            </dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {user?.email}
            </dd>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <dt className="text-xs uppercase tracking-wide text-gray-500">
              Organization
            </dt>
            <dd className="mt-1 text-sm font-medium text-gray-900">
              {org?.name}{" "}
              <span className="font-normal text-gray-500">({role})</span>
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
