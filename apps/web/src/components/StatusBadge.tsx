import type { PostStatus } from "../lib/domainTypes";

const styles: Record<PostStatus, string> = {
  open: "bg-gray-100 text-gray-700",
  planned: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

export function StatusBadge({ status }: { status: PostStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
