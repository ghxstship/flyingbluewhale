"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function MarketingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[marketing error]", error);
  }, [error]);
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="eyebrow eyebrow-brand">Off Course</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Something went wrong loading this page.</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {error.message || "We hit a snag. Try again, or head back to the homepage."}
        {error.digest ? <span className="mt-2 block font-mono text-xs">Ref: {error.digest}</span> : null}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
    </main>
  );
}
