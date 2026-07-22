"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/Button";

/**
 * Error boundary for the LEG3ND shell. Client render errors only reach Sentry
 * through this explicit capture (the server-side onRequestError hook never sees
 * them). Renders inside the LEG3ND `<main>`, keeping the shell chrome. Uses
 * plain copy (not useT) to avoid depending on a LocaleProvider in this subtree.
 */
export default function LegendError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[legend error]", error);
  }, [error]);
  return (
    <div className="surface p-8">
      <p className="eyebrow">Error</p>
      <h1 className="mt-1 text-[var(--p-text-1)]">Something Went Wrong</h1>
      {error.digest ? <p className="mt-1 font-mono text-xs text-[var(--p-text-3)]">Ref: {error.digest}</p> : null}
      <p className="mt-2 text-sm text-[var(--p-text-2)]">{error.message || "An unexpected error occurred."}</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button href="/legend" variant="secondary">
          Back to LEG3ND
        </Button>
      </div>
    </div>
  );
}
