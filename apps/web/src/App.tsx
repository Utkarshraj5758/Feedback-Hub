import { useEffect, useState } from "react";

type Health = { ok: boolean; service: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Health>;
      })
      .then(setHealth)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err)),
      );
  }, []);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
        maxWidth: 640,
        margin: "0 auto",
      }}
    >
      <h1>FeedbackHub</h1>
      <p>Phase 0 skeleton is up and running.</p>
      <p>
        API health:{" "}
        {health ? (
          <strong>
            {health.ok ? "ok" : "not ok"} ({health.service})
          </strong>
        ) : error ? (
          <span>error — {error}</span>
        ) : (
          <span>checking…</span>
        )}
      </p>
    </main>
  );
}
