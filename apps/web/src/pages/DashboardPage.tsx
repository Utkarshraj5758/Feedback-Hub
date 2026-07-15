import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { EmptyState, ErrorState, Loading } from "../components/states";
import { Button } from "../components/ui";
import { useBoards, useCreateBoard } from "../lib/queries";
import { isAdmin } from "../lib/roles";
import { ApiError } from "../lib/types";

export function DashboardPage() {
  const { role } = useAuth();
  const boards = useBoards();
  const createBoard = useCreateBoard();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canManage = isAdmin(role);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Board name is required");
      return;
    }
    try {
      await createBoard.mutateAsync({ name: trimmed });
      setName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create board");
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold text-gray-900">Boards</h1>

      {canManage && (
        <form onSubmit={onCreate} className="mt-4">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New board name"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <Button type="submit" disabled={createBoard.isPending}>
              {createBoard.isPending ? "Creating…" : "Create board"}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}

      <div className="mt-6">
        {boards.isLoading ? (
          <Loading />
        ) : boards.isError ? (
          <ErrorState
            message="Couldn't load boards."
            onRetry={() => void boards.refetch()}
          />
        ) : boards.data && boards.data.length === 0 ? (
          <EmptyState
            title="No boards yet"
            hint={
              canManage
                ? "Create your first board above."
                : "An admin hasn't created any boards yet."
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {boards.data?.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/boards/${b.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-400"
                >
                  <span className="font-medium text-gray-900">{b.name}</span>
                  {!b.isPublic && (
                    <span className="ml-2 text-xs text-gray-400">private</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
