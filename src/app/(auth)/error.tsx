"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[auth error]", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sign-In Error</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {error.message || "We couldn't complete the request. Try again or contact support if this persists."}
        {error.digest ? <span className="mt-2 block font-mono text-xs">Ref: {error.digest}</span> : null}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button href="/login" variant="secondary">
          Back To Sign In
        </Button>
      </div>
    </div>
  );
}
