"use client";

import { useEffect } from "react";

export default function MobileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[mobile error]", error); }, [error]);
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-error)]">Error</div>
      <h1 className="mt-2 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{error.message}</p>
      <button onClick={reset} className="btn btn-primary mt-4 w-full">Try again</button>
    </div>
  );
}
