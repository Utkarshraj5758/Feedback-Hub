import { useToggleVote } from "../lib/queries";

interface Props {
  postId: string;
  boardId?: string;
  voteCount: number;
  hasVoted: boolean;
}

// Upvote toggle. Optimistic state is handled in the useToggleVote cache update,
// so the count/filled-state reflect the latest cache immediately.
export function VoteButton({ postId, boardId, voteCount, hasVoted }: Props) {
  const toggle = useToggleVote(postId, boardId);

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      aria-pressed={hasVoted}
      aria-label={hasVoted ? "Remove upvote" : "Upvote"}
      className={`flex w-12 shrink-0 flex-col items-center rounded-md border px-2 py-1 ${
        hasVoted
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
      }`}
    >
      <span aria-hidden className="text-xs leading-none">
        &#9650;
      </span>
      <span className="text-sm font-medium">{voteCount}</span>
    </button>
  );
}
