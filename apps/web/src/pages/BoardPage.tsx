import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { EmptyState, ErrorState, Loading } from "../components/states";
import { StatusBadge } from "../components/StatusBadge";
import { VoteButton } from "../components/VoteButton";
import { Button } from "../components/ui";
import { useBoard, useCreatePost, usePosts } from "../lib/queries";
import type { PostDTO } from "../lib/domainTypes";
import { ApiError } from "../lib/types";

export function BoardPage() {
  const { boardId = "" } = useParams();
  const board = useBoard(boardId);
  const posts = usePosts(boardId);
  const createPost = useCreatePost(boardId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  // API returns newest-first; product wants most-voted-first (createdAt tiebreak).
  const sorted = [...(posts.data ?? [])].sort(
    (a, b) =>
      b.voteCount - a.voteCount || (a.createdAt < b.createdAt ? 1 : -1),
  );

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError("Title and details are required");
      return;
    }
    try {
      await createPost.mutateAsync({ title: title.trim(), body: body.trim() });
      setTitle("");
      setBody("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create post");
    }
  };

  return (
    <AppShell back={{ to: "/dashboard", label: "Boards" }}>
      <h1 className="text-2xl font-semibold text-gray-900">
        {board.data?.name ?? (board.isLoading ? "…" : "Board")}
      </h1>

      <form
        onSubmit={onCreate}
        className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-white p-4"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your request…"
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={createPost.isPending}>
            {createPost.isPending ? "Posting…" : "New post"}
          </Button>
        </div>
      </form>

      <div className="mt-6">
        {posts.isLoading ? (
          <Loading />
        ) : posts.isError ? (
          <ErrorState
            message="Couldn't load posts."
            onRetry={() => void posts.refetch()}
          />
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No posts yet"
            hint="Be the first to post a request."
          />
        ) : (
          <ul className="space-y-3">
            {sorted.map((p) => (
              <PostRow key={p.id} post={p} boardId={boardId} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function PostRow({ post, boardId }: { post: PostDTO; boardId: string }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <VoteButton
        postId={post.id}
        boardId={boardId}
        voteCount={post.voteCount}
        hasVoted={post.hasVoted}
      />
      <div className="min-w-0 flex-1">
        <Link
          to={`/boards/${boardId}/posts/${post.id}`}
          className="font-medium text-gray-900 hover:underline"
        >
          {post.title}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={post.status} />
          <span className="text-xs text-gray-500">
            {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </li>
  );
}
