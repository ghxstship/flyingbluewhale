"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { decideRevisionAction } from "../actions";
import type { FormState } from "@/components/FormShell";

type Decision = "approved" | "changes_requested" | "rejected";

const OPTIONS: { value: Decision; title: string; sub: string }[] = [
  { value: "approved", title: "Approve", sub: "Lock the deliverable as-is." },
  { value: "changes_requested", title: "Request changes", sub: "Round closes; we'll open the next round." },
  { value: "rejected", title: "Reject", sub: "Stop the line — significant rethink needed." },
];

export function RevisionDecision({ slug, proposalId, roundId }: { slug: string; proposalId: string; roundId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(decideRevisionAction, null);
  const [decision, setDecision] = useState<Decision>("approved");

  return (
    <form action={formAction} className="surface space-y-3 p-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="proposalId" value={proposalId} />
      <input type="hidden" name="roundId" value={roundId} />
      <input type="hidden" name="decision" value={decision} />
      <div className="eyebrow text-xs text-[var(--text-muted)]">Your decision</div>
      <h3 className="text-base font-semibold">Decide on This Round</h3>

      <div className="grid gap-2 md:grid-cols-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDecision(opt.value)}
            className={`rounded border-2 p-4 text-start transition ${
              decision === opt.value
                ? "border-[var(--org-primary)] bg-[var(--org-primary)]/5"
                : "border-[var(--border-color)] hover:border-[var(--border-hover)]"
            }`}
          >
            <div className="text-sm font-semibold">{opt.title}</div>
            <div className="text-xs text-[var(--text-muted)]">{opt.sub}</div>
          </button>
        ))}
      </div>

      <textarea
        name="note"
        rows={3}
        placeholder="Notes for the team — what's working, what isn't…"
        className="input-base w-full"
      />

      {state?.error && <Alert kind="error">{state.error}</Alert>}
      {state?.ok && <Alert kind="success">Decision recorded.</Alert>}

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={pending}
          variant={decision === "rejected" ? "danger" : decision === "approved" ? "primary" : "secondary"}
        >
          Submit decision
        </Button>
      </div>
    </form>
  );
}
