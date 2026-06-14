"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { reindexCorpus, type State } from "./actions";

/**
 * Manual corpus reindex trigger. Walks the org's deliverables / submittals /
 * RFIs and feeds each to the embed-source endpoint server-side. Disabled
 * while the walk runs (it can be slow on large orgs — each document is a
 * round-trip to the embedding provider).
 */
export function ReindexButton() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async () => reindexCorpus(),
    null,
  );

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          <RefreshCw size={14} aria-hidden />
          {pending ? "Reindexing…" : "Reindex corpus"}
        </Button>
      </form>
      {state?.ok && (
        <Alert kind="success" title="Reindex complete">
          {state.indexed} document{state.indexed === 1 ? "" : "s"} embedded
          {typeof state.skipped === "number" && state.skipped > 0
            ? `, ${state.skipped} already current or skipped.`
            : "."}
        </Alert>
      )}
      {state?.error && (
        <Alert kind="error" title="Reindex failed">
          {state.error}
        </Alert>
      )}
    </div>
  );
}
