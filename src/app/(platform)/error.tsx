"use client";

import { useEffect } from "react";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";

export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("[console error]", error); }, [error]);
  return (
    <>
      <ModuleHeader eyebrow="Error" title="Something went wrong" subtitle={error.digest ? `Ref: ${error.digest}` : undefined} />
      <div className="page-content">
        <div className="surface p-6">
          <p className="text-sm text-[var(--text-secondary)]">{error.message || "An unexpected error occurred."}</p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => reset()}>Try again</Button>
            <Button href="/console" variant="secondary">Back to console</Button>
          </div>
        </div>
      </div>
    </>
  );
}
