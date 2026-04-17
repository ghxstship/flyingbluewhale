"use client";

import { useEffect } from "react";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Sentry/other error reporters pick this up via their hooks; here we just console.
    console.error("[root error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-error)]">Error</div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {error.message || "An unexpected error occurred."}
        {error.digest && <span className="ml-2 font-mono text-xs">ref: {error.digest}</span>}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button onClick={reset} className="btn btn-primary">Try again</button>
        <a href="/" className="btn btn-secondary">Home</a>
      </div>
    </div>
  );
}
