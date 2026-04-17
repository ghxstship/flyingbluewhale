"use client";

import { useEffect } from "react";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[portal error]", error); }, [error]);
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-error)]">Error</div>
      <h1 className="mt-3 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{error.message}</p>
      <button onClick={reset} className="btn btn-primary mt-6">Try again</button>
    </div>
  );
}
