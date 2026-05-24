"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function PersonalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[personal error]", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something Went Wrong</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {error.message || "We hit an error loading your account view."}
        {error.digest ? <span className="mt-2 block font-mono text-xs">Ref: {error.digest}</span> : null}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => reset()}>Try Again</Button>
        <Button href="/me" variant="secondary">
          Back To Your Space
        </Button>
      </div>
    </div>
  );
}
