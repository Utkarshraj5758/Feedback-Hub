export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="py-12 text-center text-sm text-gray-500">{label}</div>;
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 underline hover:no-underline">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-12 text-center">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {hint && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
    </div>
  );
}
