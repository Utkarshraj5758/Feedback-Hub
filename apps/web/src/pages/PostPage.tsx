import { useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";
import { EmptyState, ErrorState, Loading } from "../components/states";
import { StatusBadge } from "../components/StatusBadge";
import { VoteButton } from "../components/VoteButton";
import { Button } from "../components/ui";
import type { PostDTO, PostStatus } from "../lib/domainTypes";
import {
  useComments,
  useCreateComment,
  usePost,
  useUpdatePostStatus,
} from "../lib/queries";
import { isAdmin } from "../lib/roles";
import { ApiError } from "../lib/types";

const STATUSES: PostStatus[] = ["open", "planned", "done"];

export function PostPage() {
  const { boardId = "", postId = "" } = useParams();
  const post = usePost(postId);

  return (
    <AppShell back={{ to: `/boards/${boardId}`, label: "Board" }}>
      {post.isLoading ? (
        <Loading />
      ) : post.isError || !post.data ? (
        <ErrorState
          message="Couldn't load this post."
          onRetry={() => void post.refetch()}
        />
      ) : (
        <PostDetail post={post.data} boardId={boardId} />
      )}
    </AppShell>
  );
}

function PostDetail({ post, boardId }: { post: PostDTO; boardId: string }) {
  const { role } = useAuth();
  const updateStatus = useUpdatePostStatus(boardId);
  const comments = useComments(post.id);
  const createComment = useCreateComment(post.id);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onComment = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    try {
      await createComment.mutateAsync({ body: body.trim() });
      setBody("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add comment");
    }
  };

  return (
    <>
      <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-5">
        <VoteButton
          postId={post.id}
          boardId={boardId}
          voteCount={post.voteCount}
          hasVoted={post.hasVoted}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{post.title}</h1>
            <StatusBadge status={post.status} />
          </div>
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{post.body}</p>

          {isAdmin(role) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Set status
              </span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updateStatus.isPending || post.status === s}
                  onClick={() => updateStatus.mutate({ id: post.id, status: s })}
                  className={`rounded-full px-3 py-1 text-xs font-medium disabled:cursor-not-allowed ${
                    post.status === s
                      ? "bg-gray-900 text-white"
                      : "border border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-gray-900">Comments</h2>
      <form
        onSubmit={onComment}
        className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-white p-4"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={createComment.isPending}>
            {createComment.isPending ? "Posting…" : "Comment"}
          </Button>
        </div>
      </form>

      <div className="mt-4">
        {comments.isLoading ? (
          <Loading />
        ) : comments.isError ? (
          <ErrorState
            message="Couldn't load comments."
            onRetry={() => void comments.refetch()}
          />
        ) : comments.data && comments.data.length === 0 ? (
          <EmptyState title="No comments yet" />
        ) : (
          <ul className="space-y-3">
            {comments.data?.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <p className="text-sm font-medium text-gray-900">
                  {c.author.name}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {c.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
